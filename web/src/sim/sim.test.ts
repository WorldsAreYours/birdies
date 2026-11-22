import { describe, expect, it } from 'vitest';

import { daylightFor, seasonOf } from '../env/season.js';
import { periodOf } from '../env/period.js';
import type { Environment, Period, Season } from '../env/types.js';
import { americanRobin } from '../species/catalog.js';
import type { SpeciesRecord } from '../species/types.js';
import { mulberry32 } from './random.js';
import { SEASON_FACTORS, STRATUM_FACTORS, expectedEvents, vocalizationRate, stratumFactor } from './rate.js';
import { pickVariant } from './variants.js';
import { simulate } from './simulate.js';
import { nextHorizon, windowEvents } from './scheduler.js';
import type { PlacedBird } from './types.js';

/** Build an Environment at a given hour of a given day, without a real clock. */
function envAt(dayOfYear: number, hour: number): Environment {
  const daylight = daylightFor(dayOfYear);
  const season: Season = seasonOf(dayOfYear);
  return { hour, season, habitat: 'suburban-yard', daylight, period: periodOf(hour, daylight) };
}

const SPRING_DAWN = envAt(121, daylightFor(121).sunrise - 0.2);
const SPRING_MIDDAY = envAt(121, 12);
const SPRING_NIGHT = envAt(121, 2);

const robinPlaced = (stratum: PlacedBird['stratum']): PlacedBird => ({
  record: americanRobin,
  stratum,
});

/** A copy of the robin that is absent in winter, to prove absence silences the yard. */
type MutableSeasonality = { seasonality: Record<Season, 'breeding' | 'present' | 'absent'> };

function absentInWinter(): SpeciesRecord {
  const record = structuredClone(americanRobin) as unknown as SpeciesRecord & MutableSeasonality;
  (record as unknown as MutableSeasonality).seasonality.winter = 'absent';
  return record;
}

describe('rate: seasons and periods', () => {
  it('plays the counted dawn element figure at full strength', () => {
    const rate = vocalizationRate(americanRobin, SPRING_DAWN, 'canopy');
    // 67.7 until 2026-11-22, when the source recording turned out to be Hermit
    // Thrush and dawn was re-anchored on the clean single male in XC570791.
    expect(rate.perMinute).toBeCloseTo(51.2, 5);
    expect(rate.confidence).toBe('counted');
    expect(rate.unit).toBe('element');
  });

  it('marks a declared simplification as simplified rather than sourced', () => {
    const rate = vocalizationRate(americanRobin, SPRING_MIDDAY, 'canopy');
    expect(rate.perMinute).toBeCloseTo(10, 5);
    expect(rate.confidence).toBe('simplified');
  });

  it('treats a published zero as known silence, not unknown', () => {
    const rate = vocalizationRate(americanRobin, SPRING_NIGHT, 'canopy');
    expect(rate.perMinute).toBe(0);
    expect(rate.confidence).toBe('sourced');
  });

  it('returns zero when the season says absent', () => {
    const winter = envAt(30, 12);
    expect(winter.season).toBe('winter');
    const rate = vocalizationRate(absentInWinter(), { season: 'winter', period: 'midday' }, 'canopy');
    expect(rate.perMinute).toBe(0);
    expect(rate.confidence).toBe('none');
  });

  it('returns zero and no confidence when a period has no figure', () => {
    const record = structuredClone(americanRobin) as unknown as {
      cadence: Partial<Record<Period, unknown>>;
    };
    delete record.cadence.midday;
    const rate = vocalizationRate(record as unknown as SpeciesRecord, SPRING_MIDDAY, 'canopy');
    expect(rate.perMinute).toBe(0);
    expect(rate.confidence).toBe('none');
  });

  it('halves the rate for a bird that is merely present', () => {
    const fall = { season: 'fall' as const, period: 'dawn' as const };
    const rate = vocalizationRate(americanRobin, fall, 'canopy');
    expect(rate.perMinute).toBeCloseTo(51.2 * SEASON_FACTORS.present, 5);
    expect(rate.confidence).toBe('counted');
  });
});

describe('rate: placement (D10)', () => {
  it('differentiates preferred, tolerated and foreign strata', () => {
    expect(stratumFactor(americanRobin, 'canopy')).toBe(STRATUM_FACTORS.preferred);
    expect(stratumFactor(americanRobin, 'midstory')).toBe(STRATUM_FACTORS.tolerated);
    expect(stratumFactor(americanRobin, 'bath')).toBe(STRATUM_FACTORS.foreign);
  });

  it('sings less the worse the placement', () => {
    const canopy = vocalizationRate(americanRobin, SPRING_DAWN, 'canopy').perMinute;
    const midstory = vocalizationRate(americanRobin, SPRING_DAWN, 'midstory').perMinute;
    const bath = vocalizationRate(americanRobin, SPRING_DAWN, 'bath').perMinute;
    expect(canopy).toBeGreaterThan(midstory);
    expect(midstory).toBeGreaterThan(bath);
    expect(bath).toBeGreaterThan(0);
  });

  it('reports expected event counts consistently with the rate', () => {
    expect(expectedEvents(americanRobin, SPRING_DAWN, 'canopy', 60)).toBeCloseTo(51.2, 4);
    expect(expectedEvents(americanRobin, SPRING_NIGHT, 'canopy', 60)).toBe(0);
  });
});

describe('variants', () => {
  const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('never repeats the same variant twice in a row when alternatives exist', () => {
    const rng = mulberry32(7);
    let last: string | null = null;
    for (let i = 0; i < 500; i++) {
      const chosen: { id: string } | null = pickVariant(pool, rng, last);
      expect(chosen).not.toBeNull();
      expect(chosen?.id).not.toBe(last);
      last = chosen?.id ?? null;
    }
  });

  it('repeats when there is nothing else to play', () => {
    const rng = mulberry32(1);
    const one = [{ id: 'only' }];
    expect(pickVariant(one, rng, 'only')?.id).toBe('only');
  });

  it('returns null for an empty repertoire rather than throwing', () => {
    expect(pickVariant([], mulberry32(1), null)).toBeNull();
  });

  it('is deterministic for a seed', () => {
    const draw = (seed: number) => {
      const rng = mulberry32(seed);
      let last: string | null = null;
      return Array.from({ length: 30 }, () => {
        const chosen = pickVariant(pool, rng, last);
        last = chosen?.id ?? null;
        return chosen?.id;
      });
    };
    expect(draw(99)).toEqual(draw(99));
    expect(draw(99)).not.toEqual(draw(100));
  });
});

describe('simulate', () => {
  it('produces events at roughly the documented rate', () => {
    const events = simulate(SPRING_DAWN, [robinPlaced('canopy')], { seed: 1, horizonSeconds: 60 });
    // Poisson with mean 51.2: a ±3σ band is roughly 28–75. Wide on purpose —
    // the test is that the model is Poisson at the stated rate, not that it is exact.
    expect(events.length).toBeGreaterThan(40);
    expect(events.length).toBeLessThan(97);
  });

  it('is deterministic for a seed', () => {
    const a = simulate(SPRING_DAWN, [robinPlaced('canopy')], { seed: 42, horizonSeconds: 120 });
    const b = simulate(SPRING_DAWN, [robinPlaced('canopy')], { seed: 42, horizonSeconds: 120 });
    expect(a).toEqual(b);
  });

  it('differs between seeds', () => {
    const a = simulate(SPRING_DAWN, [robinPlaced('canopy')], { seed: 1, horizonSeconds: 120 });
    const b = simulate(SPRING_DAWN, [robinPlaced('canopy')], { seed: 2, horizonSeconds: 120 });
    expect(a).not.toEqual(b);
  });

  it('goes silent when the season says absent', () => {
    const winterMidday = envAt(30, 12);
    const events = simulate(
      winterMidday,
      [{ record: absentInWinter(), stratum: 'canopy' }],
      { seed: 3, horizonSeconds: 600 },
    );
    expect(events).toEqual([]);
  });

  it('goes silent at night, which the record states as known silence', () => {
    expect(simulate(SPRING_NIGHT, [robinPlaced('canopy')], { seed: 4, horizonSeconds: 600 })).toEqual(
      [],
    );
  });

  it('returns events in ascending time order', () => {
    const events = simulate(SPRING_DAWN, [robinPlaced('canopy')], { seed: 5, horizonSeconds: 300 });
    const times = events.map((event) => event.atSeconds);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('only schedules clips the record actually ships', () => {
    const events = simulate(SPRING_DAWN, [robinPlaced('canopy')], { seed: 6, horizonSeconds: 300 });
    const shipped = new Set(americanRobin.songs.map((song) => song.id));
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) expect(shipped.has(event.variantId)).toBe(true);
  });

  it('repeats the only shipped variant, because there is no alternative', () => {
    // The robin ships one song so far. The no-immediate-repeat rule belongs to
    // pickVariant; here the honest expectation is repetition, not variety.
    const events = simulate(SPRING_DAWN, [robinPlaced('canopy')], { seed: 8, horizonSeconds: 300 });
    const ids = new Set(events.map((event) => event.variantId));
    expect(ids.size).toBe(1);
    expect(events.length).toBeGreaterThan(1);
  });

  it('honours placement over a long horizon', () => {
    const good = simulate(SPRING_MIDDAY, [robinPlaced('canopy')], { seed: 9, horizonSeconds: 3600 });
    const bad = simulate(SPRING_MIDDAY, [robinPlaced('bath')], { seed: 9, horizonSeconds: 3600 });
    expect(bad.length).toBeLessThan(good.length);
  });

  it('handles an empty yard and a zero horizon', () => {
    expect(simulate(SPRING_DAWN, [], { seed: 1, horizonSeconds: 60 })).toEqual([]);
    expect(simulate(SPRING_DAWN, [robinPlaced('canopy')], { seed: 1, horizonSeconds: 0 })).toEqual([]);
  });

  it('interleaves two placed birds and keeps a stable order', () => {
    const events = simulate(
      SPRING_DAWN,
      [robinPlaced('canopy'), robinPlaced('midstory')],
      { seed: 11, horizonSeconds: 60 },
    );
    const preferred = events.filter((event) => event.stratum === 'canopy').length;
    const tolerated = events.filter((event) => event.stratum === 'midstory').length;
    expect(preferred).toBeGreaterThan(tolerated);
    for (let i = 1; i < events.length; i++) {
      const previous = events[i - 1];
      const current = events[i];
      expect(previous).toBeDefined();
      expect(current).toBeDefined();
      if (!previous || !current) continue;
      expect(current.atSeconds).toBeGreaterThanOrEqual(previous.atSeconds);
      // Ties resolve by generation order, which is what makes the sort stable.
      if (current.atSeconds === previous.atSeconds) {
        expect(current.sequence).toBeGreaterThan(previous.sequence);
      }
    }
  });
});

describe('scheduler', () => {
  const events = simulate(SPRING_DAWN, [robinPlaced('canopy')], { seed: 13, horizonSeconds: 30 });

  it('treats the window as half-open so nothing plays twice', () => {
    const first = events[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(windowEvents(events, first.atSeconds, first.atSeconds + 0.0001)).toHaveLength(1);
    expect(windowEvents(events, first.atSeconds + 0.0001, 30)).not.toContain(first);
  });

  it('returns nothing for an inverted or empty window', () => {
    expect(windowEvents(events, 10, 10)).toEqual([]);
    expect(windowEvents(events, 20, 10)).toEqual([]);
  });

  it('returns only events inside the window', () => {
    const slice = windowEvents(events, 5, 15);
    for (const event of slice) {
      expect(event.atSeconds).toBeGreaterThanOrEqual(5);
      expect(event.atSeconds).toBeLessThan(15);
    }
  });

  it('computes the next horizon from the playhead', () => {
    expect(nextHorizon(10, 30)).toBe(40);
    expect(nextHorizon(-5, 30)).toBe(30);
  });
});
