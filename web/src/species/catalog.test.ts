import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { americanRobin, assertCatalogueValid, catalogue, getRecord, validateRecord } from './catalog.js';
import type { SpeciesRecord } from './types.js';

const PUBLIC = join(process.cwd(), 'public');

/** Deep clone so a mutation in one test cannot leak into another. */
const clone = (): SpeciesRecord => structuredClone(americanRobin);

describe('catalogue', () => {
  it('is structurally valid', () => {
    expect(validateRecord(americanRobin)).toEqual([]);
    expect(() => assertCatalogueValid()).not.toThrow();
  });

  it('is reachable by id', () => {
    expect(getRecord('american-robin').id).toBe('american-robin');
    expect(() => getRecord('blue-jay' as never)).toThrow(/Unknown species/);
  });

  it('ships no record that claims to be verified', () => {
    // Nothing in Phase 1 can be verified: the measurements are mechanical and
    // unauditioned. This test fails the day someone flips the flag without doing
    // the work, which is exactly the failure the flag exists to catch.
    expect(catalogue.filter((record) => record.verified)).toEqual([]);
  });
});

describe('american robin record', () => {
  it('ships audio files that exist on disk', () => {
    for (const variant of [...americanRobin.songs, ...americanRobin.calls]) {
      const path = join(PUBLIC, variant.clip);
      expect(existsSync(path), `${variant.clip} missing`).toBe(true);
    }
  });

  it('anchors cadence on the published dawn floor and records what it replaced', () => {
    const dawn = americanRobin.cadence.dawn;
    expect(dawn?.method).toBe('published');
    expect(dawn?.unit).toBe('element');
    expect(dawn?.perMinute).toBeGreaterThan(0);
  });

  it('declares every simplification as simplified and lists it as provisional', () => {
    const simplified = Object.entries(americanRobin.cadence)
      .filter(([, claim]) => claim?.method === 'simplified')
      .map(([period]) => period);
    expect(simplified.length).toBeGreaterThan(0);
    for (const period of simplified) {
      expect(americanRobin.provisional.join('\n')).toContain(`cadence.${period}`);
    }
  });

  it('writes both journal depths, and they are not the same text', () => {
    expect(americanRobin.journal.child.trim().length).toBeGreaterThan(0);
    expect(americanRobin.journal.birder.trim().length).toBeGreaterThan(0);
    expect(americanRobin.journal.child).not.toBe(americanRobin.journal.birder);
  });
});

describe('validator rules', () => {
  it('rejects verified:true while provisional fields are listed', () => {
    const record = clone();
    (record as { verified: boolean }).verified = true;
    expect(validateRecord(record).join(' ')).toMatch(/verified is true but \d+ provisional/);
  });

  it('rejects verified:false with nothing listed as provisional', () => {
    const record = clone();
    (record as unknown as { provisional: string[] }).provisional = [];
    expect(validateRecord(record).join(' ')).toMatch(/nothing is listed as provisional/);
  });

  it('rejects a simplified claim that carries a citation', () => {
    const record = clone();
    // @ts-expect-error deliberately breaking the invariant under test
    record.cadence.morning.citationId = 'wiki-american-robin';
    expect(validateRecord(record).join(' ')).toMatch(/simplified but claims a citation/);
  });

  it('rejects a counted claim with no citation', () => {
    const record = clone();
    const claim = record.cadence.dusk as { method: string; citationId: string | null };
    claim.method = 'counted';
    claim.citationId = null;
    expect(validateRecord(record).join(' ')).toMatch(/counted but has no citation/);
  });

  it('rejects a measured claim with no detector block', () => {
    const record = clone();
    const claim = record.cadence.dawn as { method: string };
    claim.method = 'measured';
    expect(validateRecord(record).join(' ')).toMatch(/measured but has no detector block/);
  });

  it('rejects a machine-counted song rate', () => {
    const record = clone();
    const claim = record.cadence.dawn as { unit: string; method: string };
    claim.unit = 'song';
    claim.method = 'counted';
    expect(validateRecord(record).join(' ')).toMatch(/song rate without an annotation/);
  });

  it('rejects a citation to a source that does not exist', () => {
    const record = clone();
    // @ts-expect-error deliberately breaking the invariant under test
    record.cadence.dawn.citationId = 'invented-source';
    expect(validateRecord(record).join(' ')).toMatch(/unknown source invented-source/);
  });

  it('rejects a clip whose declared duration disagrees with its range', () => {
    const record = clone();
    (record.songs[0] as { durationSeconds: number }).durationSeconds = 30;
    expect(validateRecord(record).join(' ')).toMatch(/disagrees with its clip range/);
  });

  it('rejects an annotated claim without an annotation block', () => {
    const record = clone();
    const claim = record.cadence.dawn as { method: string; citationId: string | null };
    claim.method = 'annotated';
    claim.citationId = null;
    expect(validateRecord(record).join(' ')).toMatch(/annotated but has no annotation block/);
  });

  it('rejects a clip that would overlap itself at the stated rate', () => {
    const record = clone();
    const variant = structuredClone(americanRobin.songs[0]!);
    (variant as { clipUnit: string }).clipUnit = 'element';
    (variant as { durationSeconds: number }).durationSeconds = 10.04;
    (record.songs as unknown as Array<typeof variant>).push(variant);
    expect(validateRecord(record).join(' ')).toMatch(/would overlap/);
  });

  it('rejects a clip filed under another species', () => {
    const record = clone();
    (record.songs[0] as { clip: string }).clip = 'audio/blue-jay/robin.mp3';
    expect(validateRecord(record).join(' ')).toMatch(/not under audio\/american-robin\//);
  });

  it('rejects a repertoire count that disagrees with the audio list', () => {
    const record = clone();
    (record.repertoire as { shipped: number }).shipped = 5;
    expect(validateRecord(record).join(' ')).toMatch(/repertoire\.shipped does not match/);
  });

  it('rejects a cadence note too short to explain itself', () => {
    const record = clone();
    (record.cadence.midday as { note: string }).note = 'guess';
    expect(validateRecord(record).join(' ')).toMatch(/note is too short/);
  });

  it('rejects a record with no dawn anchor at all', () => {
    const record = clone();
    (record as { cadence: Record<string, unknown> }).cadence = { midday: americanRobin.cadence.midday };
    expect(validateRecord(record).join(' ')).toMatch(/no dawn cadence figure/);
  });
});
