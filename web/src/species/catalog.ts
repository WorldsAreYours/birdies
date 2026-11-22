import type { Period } from '../env/types.js';
import { isLicence, licenceFacts } from './licences.js';
import type { ClipUnit, SpeciesRecord, VocalizationUnit } from './types.js';
import { americanRobin } from './records/american-robin.js';

/**
 * Catalogue validation.
 *
 * The plan's Phase 2 asks for a "facts linter" in CI. This is the part of it that
 * can exist on day one: structural rules that make an unverifiable claim
 * impossible to express, rather than merely discouraged in review.
 *
 * It is pure and returns problems instead of throwing, so tests can assert on
 * specific failures and the build can print all of them at once.
 */

const PERIODS: readonly Period[] = ['dawn', 'morning', 'midday', 'dusk', 'night'];
const UNITS: readonly VocalizationUnit[] = ['element', 'song', 'bout'];
const CLIP_UNITS: readonly ClipUnit[] = [...UNITS, 'excerpt'];

export function validateRecord(record: SpeciesRecord): string[] {
  const problems: string[] = [];
  const sourceIds = new Set(record.sources.map((source) => source.id));

  if (sourceIds.size !== record.sources.length) {
    problems.push(`${record.id}: duplicate citation ids in sources`);
  }

  // `verified` is a promise about the whole record, so it has to be consistent
  // with `provisional` in both directions.
  if (record.verified && record.provisional.length > 0) {
    problems.push(`${record.id}: verified is true but ${record.provisional.length} provisional field(s) are listed`);
  }
  if (!record.verified && record.provisional.length === 0) {
    problems.push(`${record.id}: verified is false but nothing is listed as provisional, so the flag is unexplained`);
  }

  // Dawn is the anchor: every other period is a simplification derived from it.
  if (!record.cadence.dawn) {
    problems.push(`${record.id}: no dawn cadence figure`);
  }

  for (const period of PERIODS) {
    const claim = record.cadence[period];
    if (!claim) continue;
    if (!Number.isFinite(claim.perMinute) || claim.perMinute < 0) {
      problems.push(`${record.id}: cadence.${period} is not a non-negative finite number`);
    }
    if (!UNITS.includes(claim.unit)) {
      problems.push(`${record.id}: cadence.${period} has unknown unit ${String(claim.unit)}`);
    }
    // Song is a functional label first. As a counting unit it exists only when a
    // human or a paper defined the boundary; the envelope cannot find one.
    if (claim.unit === 'song' && claim.method !== 'annotated' && claim.method !== 'published') {
      problems.push(
        `${record.id}: cadence.${period} claims a song rate without an annotation or published definition`,
      );
    }
    if (claim.method === 'annotated' && !claim.annotation) {
      problems.push(`${record.id}: cadence.${period} is annotated but has no annotation block`);
    }
    if (claim.method === 'measured' && !claim.detector) {
      problems.push(`${record.id}: cadence.${period} is measured but has no detector block`);
    }
    if (claim.method === 'derived' && !claim.derivation) {
      problems.push(`${record.id}: cadence.${period} is derived but has no derivation text`);
    }
    if (claim.method === 'simplified') {
      if (claim.citationId !== null) {
        problems.push(`${record.id}: cadence.${period} is simplified but claims a citation`);
      }
    } else if (claim.citationId === null && claim.method !== 'annotated' && claim.method !== 'derived') {
      problems.push(`${record.id}: cadence.${period} is ${claim.method} but has no citation`);
    } else if (claim.citationId !== null && !sourceIds.has(claim.citationId)) {
      problems.push(`${record.id}: cadence.${period} cites unknown source ${claim.citationId}`);
    }
    if (claim.note.trim().length < 20) {
      problems.push(`${record.id}: cadence.${period} note is too short to explain the method`);
    }
  }

  const allAudio = [...record.songs, ...record.calls];
  for (const variant of allAudio) {
    // The type says NC cannot be written down, but a cast or a fetched JSON blob
    // gets past the type. This is the check that makes the licence policy a gate
    // rather than a comment, and it fails closed: an unknown string is refused.
    if (!isLicence(variant.license)) {
      problems.push(
        `${record.id}: audio ${variant.id} declares licence ${String(variant.license)}, which licence-policy.json does not permit`,
      );
    } else if (licenceFacts(variant.license).requiresAttribution) {
      if (variant.recordist.trim().length === 0) {
        problems.push(`${record.id}: audio ${variant.id} is ${variant.license} but credits no recordist`);
      }
      if (!/^https?:\/\//.test(variant.sourceUrl)) {
        problems.push(`${record.id}: audio ${variant.id} has no source URL, so its credit cannot be checked`);
      }
    }
    if (!CLIP_UNITS.includes(variant.clipUnit)) {
      problems.push(`${record.id}: audio ${variant.id} has unknown clipUnit ${String(variant.clipUnit)}`);
    }
    if (!sourceIds.has(variant.citationId)) {
      problems.push(`${record.id}: audio ${variant.id} cites unknown source ${variant.citationId}`);
    } else {
      // The credit's "Source:" line and the citation must name the same recording.
      // When they disagree the credit points somewhere the clip did not come from,
      // which is the seam an unlicensed file slips through.
      const citation = record.sources.find((source) => source.id === variant.citationId);
      if (citation && citation.url !== variant.sourceUrl) {
        problems.push(
          `${record.id}: audio ${variant.id} cites ${variant.citationId} but its sourceUrl is ${variant.sourceUrl}`,
        );
      }
    }
    if (!variant.clip.startsWith(`audio/${record.id}/`)) {
      problems.push(`${record.id}: audio ${variant.id} clip is not under audio/${record.id}/`);
    }
    if (variant.clipRange.toSeconds <= variant.clipRange.fromSeconds) {
      problems.push(`${record.id}: audio ${variant.id} has an empty clip range`);
    }
    const declared = variant.clipRange.toSeconds - variant.clipRange.fromSeconds;
    if (Math.abs(declared - variant.durationSeconds) > 0.25) {
      problems.push(
        `${record.id}: audio ${variant.id} duration ${variant.durationSeconds}s disagrees with its clip range (${declared}s)`,
      );
    }
  }

  // A clip may only serve an event of its own unit, and it must finish before the
  // next one starts. `excerpt` clips are deliberately exempt: they contain several
  // units and cannot stand in for one (see docs/vocalization-units.md §4).
  for (const period of PERIODS) {
    const claim = record.cadence[period];
    if (!claim) continue;
    for (const variant of allAudio) {
      if (variant.clipUnit !== claim.unit) continue;
      const overlap = variant.durationSeconds * (claim.perMinute / 60);
      if (overlap > 1.05) {
        problems.push(
          `${record.id}: cadence.${period} at ${claim.perMinute}/min would overlap ${variant.id} (${variant.durationSeconds}s clip, ${overlap.toFixed(2)} copies in flight)`,
        );
      }
    }
  }

  if (record.repertoire.shipped !== record.songs.length + record.calls.length) {
    problems.push(`${record.id}: repertoire.shipped does not match the number of audio variants`);
  }

  // A simplification in cadence can never be part of a verified record, even if
  // someone forgets to add it to `provisional`.
  if (record.verified) {
    const simplified = PERIODS.filter((p) => record.cadence[p]?.method === 'simplified');
    if (simplified.length > 0) {
      problems.push(`${record.id}: verified is true but cadence.${simplified.join(',')} is simplified`);
    }
    const unmatched = PERIODS.filter((p) => {
      const claim = record.cadence[p];
      return claim !== undefined && !allAudio.some((variant) => variant.clipUnit === claim.unit);
    });
    if (unmatched.length > 0) {
      problems.push(`${record.id}: verified is true but cadence.${unmatched.join(',')} has no matching clip unit`);
    }
  }

  return problems;
}

export const catalogue: readonly SpeciesRecord[] = [americanRobin];

export function assertCatalogueValid(records: readonly SpeciesRecord[] = catalogue): void {
  const problems = records.flatMap(validateRecord);
  if (problems.length > 0) {
    throw new Error(`Species catalogue is invalid:\n  - ${problems.join('\n  - ')}`);
  }
}

export function getRecord(id: SpeciesRecord['id']): SpeciesRecord {
  const found = catalogue.find((record) => record.id === id);
  if (!found) throw new Error(`Unknown species: ${id}`);
  return found;
}

export { americanRobin };
