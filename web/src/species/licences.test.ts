import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { catalogue, validateRecord } from './catalog.js';
import { creditsText } from './credits.js';
import { allLicenceFacts, isLicence, licenceFacts } from './licences.js';
import { americanRobin } from './records/american-robin.js';
import { LICENSES, licencePolicy } from './types.js';
import type { SpeciesRecord } from './types.js';

/**
 * The licence gate.
 *
 * `AGENTS.md` says NC is forbidden because it would block a paid tier. This file
 * is what makes that a mechanism: a clip whose licence the policy does not permit
 * fails the build, and so does an audio file that slipped into `public/` without a
 * record declaring it. The ingest-side half lives in `tools/curation/licence.py`,
 * which refuses the same licences before a file is even downloaded.
 */

const PUBLIC = join(process.cwd(), 'public');
const AUDIO_EXTENSIONS = /\.(mp3|ogg|oga|wav|flac|m4a)$/i;

const clone = (): SpeciesRecord => structuredClone(americanRobin);
const shipped = (record: SpeciesRecord) => [...record.songs, ...record.calls];

describe('licence policy', () => {
  it('is the single list the app can name', () => {
    expect([...LICENSES].sort()).toEqual(Object.keys(licencePolicy.licences).sort());
    expect(LICENSES.length).toBeGreaterThan(0);
  });

  it('defines a family for every licence and a deed for every CC one', () => {
    for (const facts of allLicenceFacts()) {
      expect(licencePolicy.families[facts.family as keyof typeof licencePolicy.families], facts.id).toBeDefined();
      if (facts.id === 'public-domain') {
        expect(facts.deed).toBeNull();
      } else {
        expect(facts.deed, facts.id).toMatch(/^https:\/\/creativecommons\.org\//);
      }
    }
  });

  it('permits no licence carrying an NC or ND marker', () => {
    // The policy is data, so this checks the data itself rather than trusting that
    // whoever adds the next licence read the comment above it.
    const markers = licencePolicy.forbiddenMarkers.map((pattern) => new RegExp(pattern, 'i'));
    for (const facts of allLicenceFacts()) {
      const text = `${facts.id} ${facts.family} ${facts.label}`;
      for (const marker of markers) {
        expect(marker.test(text), `${facts.id} matches forbidden marker ${String(marker)}`).toBe(false);
      }
    }
  });

  it('separates the obligations BY-SA adds from BY', () => {
    expect(licenceFacts('cc-by-4.0')).toMatchObject({ requiresAttribution: true, shareAlike: false });
    expect(licenceFacts('cc-by-sa-4.0')).toMatchObject({ requiresAttribution: true, shareAlike: true });
    expect(licenceFacts('cc0')).toMatchObject({ requiresAttribution: false, shareAlike: false });
    expect(licenceFacts('public-domain')).toMatchObject({ requiresAttribution: false, shareAlike: false });
  });

  it('labels licences the way a credit line should read', () => {
    expect(licenceFacts('cc-by-sa-4.0').label).toBe('CC BY-SA 4.0');
    expect(licenceFacts('cc-by-2.5').label).toBe('CC BY 2.5');
    expect(licenceFacts('cc0').label).toBe('CC0 1.0');
    expect(licenceFacts('public-domain').label).toBe('Public domain');
  });

  it('refuses a licence string the policy does not list', () => {
    expect(isLicence('cc-by-sa-4.0')).toBe(true);
    expect(isLicence('cc-by-nc-4.0')).toBe(false);
    expect(isLicence('cc-by-nd-4.0')).toBe(false);
    expect(isLicence('all-rights-reserved')).toBe(false);
    expect(isLicence('')).toBe(false);
  });
});

describe('every shipped clip', () => {
  const variants = catalogue.flatMap(shipped);

  it('is licensed under a permitted licence, with attribution', () => {
    for (const variant of variants) {
      expect(isLicence(variant.license), `${variant.id} licence ${variant.license}`).toBe(true);
      if (licenceFacts(variant.license).requiresAttribution) {
        expect(variant.recordist.trim(), `${variant.id} recordist`).not.toBe('');
        expect(variant.sourceUrl, `${variant.id} sourceUrl`).toMatch(/^https?:\/\//);
      }
    }
  });

  it('names the same recording in its credit and its citation', () => {
    for (const record of catalogue) {
      for (const variant of shipped(record)) {
        const citation = record.sources.find((source) => source.id === variant.citationId);
        expect(citation, `${variant.id} citation ${variant.citationId}`).toBeDefined();
        expect(citation?.url, `${variant.id} credit/citation disagree`).toBe(variant.sourceUrl);
      }
    }
  });

  it('is the only audio in its species directory', () => {
    // Everything under public/ ships. A clip sitting there without a record is
    // unreviewed audio in the bundle — exactly how an NC file would arrive.
    for (const record of catalogue) {
      const declared = new Set(shipped(record).map((variant) => variant.clip.split('/').pop()));
      const dir = join(PUBLIC, 'audio', record.id);
      if (!existsSync(dir)) continue;
      const onDisk = readdirSync(dir).filter((name) => AUDIO_EXTENSIONS.test(name));
      const orphans = onDisk.filter((name) => !declared.has(name));
      expect(orphans, `unreferenced audio in public/audio/${record.id}`).toEqual([]);
      for (const name of declared) {
        expect(onDisk, `${name} is declared but missing`).toContain(name);
      }
    }
  });
});

describe('credits', () => {
  const text = creditsText(catalogue);
  const onDisk = readFileSync(join(PUBLIC, 'audio', 'CREDITS.txt'), 'utf8');

  it('ships beside the audio and matches the records', () => {
    // `prebuild` runs the same comparison, so a stale file fails `npm run build`.
    // The copy here keeps the reason attached to the test suite.
    expect(onDisk).toBe(text);
  });

  it('credits each clip with its recordist, licence, deed and source', () => {
    for (const variant of catalogue.flatMap(shipped)) {
      const facts = licenceFacts(variant.license);
      expect(onDisk).toContain(variant.clip);
      expect(onDisk).toContain(variant.recordist);
      expect(onDisk).toContain(facts.label);
      if (facts.deed) expect(onDisk).toContain(facts.deed);
      expect(onDisk).toContain(variant.sourceUrl);
      // CC BY / BY-SA also require a statement that the audio was changed.
      if (facts.requiresAttribution) expect(onDisk).toContain('Changed for Birdie');
    }
  });

  it('states the share-alike boundary when a share-alike clip ships', () => {
    const shareAlike = catalogue.flatMap(shipped).filter((variant) => licenceFacts(variant.license).shareAlike);
    if (shareAlike.length > 0) {
      expect(onDisk).toMatch(/stay CC BY-SA/);
      for (const variant of shareAlike) expect(onDisk).toContain(variant.clip);
    }
  });
});

describe('the validator refuses what the policy forbids', () => {
  it('rejects a clip cast to an NC licence', () => {
    const record = clone();
    const variant = record.songs[0];
    if (!variant) throw new Error('fixture has no shipped song');
    (variant as { license: string }).license = 'cc-by-nc-4.0';
    expect(validateRecord(record).join('\n')).toMatch(/licence-policy\.json does not permit/);
  });

  it('rejects a credited clip with no recordist', () => {
    const record = clone();
    const variant = record.songs[0];
    if (!variant) throw new Error('fixture has no shipped song');
    (variant as { recordist: string }).recordist = '  ';
    expect(validateRecord(record).join('\n')).toMatch(/credits no recordist/);
  });

  it('rejects a credit that points at a different recording than the citation', () => {
    const record = clone();
    const variant = record.songs[0];
    if (!variant) throw new Error('fixture has no shipped song');
    (variant as { sourceUrl: string }).sourceUrl = 'https://example.invalid/other-recording.mp3';
    expect(validateRecord(record).join('\n')).toMatch(/credit\/citation|sourceUrl/);
  });
});
