import type { Period } from '../env/types.js';
import type { SpeciesRecord } from './types.js';
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
    if (!Number.isFinite(claim.songsPerMinute) || claim.songsPerMinute < 0) {
      problems.push(`${record.id}: cadence.${period} is not a non-negative finite number`);
    }
    if (claim.method === 'simplified') {
      if (claim.citationId !== null) {
        problems.push(`${record.id}: cadence.${period} is simplified but claims a citation`);
      }
    } else if (claim.citationId === null) {
      problems.push(`${record.id}: cadence.${period} is ${claim.method} but has no citation`);
    } else if (!sourceIds.has(claim.citationId)) {
      problems.push(`${record.id}: cadence.${period} cites unknown source ${claim.citationId}`);
    }
    if (claim.note.trim().length < 20) {
      problems.push(`${record.id}: cadence.${period} note is too short to explain the method`);
    }
  }

  const allAudio = [...record.songs, ...record.calls];
  for (const variant of allAudio) {
    if (!sourceIds.has(variant.citationId)) {
      problems.push(`${record.id}: audio ${variant.id} cites unknown source ${variant.citationId}`);
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
