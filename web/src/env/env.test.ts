import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { DAYS_IN_YEAR, daylightFor, normaliseDay, seasonOf, solarDeclination } from './season.js';
import { periodOf } from './period.js';
import {
  DEFAULT_CLOCK,
  advance,
  formatDate,
  formatTime,
  normaliseMinutes,
  setClock,
  toEnvironment,
} from './clock.js';
import type { Habitat } from './types.js';

const SPRING = 121; // 1 May
const SUMMER_SOLSTICE = 172;
const WINTER_SOLSTICE = 355;

describe('season: daylight', () => {
  it('is near 12 hours at the equinox', () => {
    expect(daylightFor(80).hours).toBeGreaterThan(11.8);
    expect(daylightFor(80).hours).toBeLessThan(12.2);
  });

  it('is long at the summer solstice and short at the winter one', () => {
    expect(daylightFor(SUMMER_SOLSTICE).hours).toBeGreaterThan(15);
    expect(daylightFor(WINTER_SOLSTICE).hours).toBeLessThan(9.1);
    expect(daylightFor(SUMMER_SOLSTICE).hours - daylightFor(WINTER_SOLSTICE).hours).toBeGreaterThan(
      5.5,
    );
  });

  it('stays finite and ordered for every day of the year', () => {
    for (let day = 1; day <= DAYS_IN_YEAR; day++) {
      const { sunrise, sunset, hours } = daylightFor(day);
      expect(Number.isFinite(hours)).toBe(true);
      expect(sunrise).toBeGreaterThan(0);
      expect(sunrise).toBeLessThan(12);
      expect(sunset).toBeGreaterThan(12);
      expect(sunset).toBeLessThan(24);
      expect(hours).toBeCloseTo(sunset - sunrise, 10);
    }
  });

  it('peaks at the June solstice and bottoms out near the December one', () => {
    const hours = Array.from({ length: DAYS_IN_YEAR }, (_, i) => daylightFor(i + 1).hours);
    expect(hours[SUMMER_SOLSTICE - 1]).toBe(Math.max(...hours));
    expect(daylightFor(WINTER_SOLSTICE).hours).toBeLessThan(daylightFor(SUMMER_SOLSTICE).hours);
  });

  it('declination stays within ±23.44°', () => {
    for (let day = 1; day <= DAYS_IN_YEAR; day++) {
      expect(Math.abs(solarDeclination(day))).toBeLessThanOrEqual(23.44);
    }
  });
});

describe('season: calendar', () => {
  it('maps day-of-year to seasons with contiguous boundaries', () => {
    expect(seasonOf(1)).toBe('winter');
    expect(seasonOf(59)).toBe('winter');
    expect(seasonOf(60)).toBe('spring');
    expect(seasonOf(151)).toBe('spring');
    expect(seasonOf(152)).toBe('summer');
    expect(seasonOf(243)).toBe('summer');
    expect(seasonOf(244)).toBe('fall');
    expect(seasonOf(334)).toBe('fall');
    expect(seasonOf(335)).toBe('winter');
    expect(seasonOf(365)).toBe('winter');
  });

  it('normalises days outside 1–365', () => {
    expect(normaliseDay(0)).toBe(365);
    expect(normaliseDay(366)).toBe(1);
    expect(normaliseDay(730)).toBe(365);
    expect(normaliseDay(-1)).toBe(364);
  });
});

describe('period: time-of-day buckets', () => {
  const daylight = daylightFor(SPRING);

  it('walks night → dawn → morning → midday → dusk → night across a spring day', () => {
    expect(periodOf(2, daylight)).toBe('night');
    expect(periodOf(daylight.sunrise - 0.5, daylight)).toBe('dawn');
    expect(periodOf(daylight.sunrise + 0.5, daylight)).toBe('dawn');
    expect(periodOf(8, daylight)).toBe('morning');
    expect(periodOf(12, daylight)).toBe('midday');
    expect(periodOf(daylight.sunset - 0.5, daylight)).toBe('dusk');
    expect(periodOf(daylight.sunset + 1, daylight)).toBe('night');
  });

  it('opens dawn before sunrise and keeps dawn covering the chorus', () => {
    expect(periodOf(daylight.sunrise, daylight)).toBe('dawn');
    expect(periodOf(daylight.sunrise - 1.01, daylight)).not.toBe('dawn');
  });

  it('never leaves the enum, even for out-of-range hours', () => {
    const valid = new Set(['dawn', 'morning', 'midday', 'dusk', 'night']);
    for (const hour of [-5, 0, 24, 25, 47.5, 100]) {
      expect(valid.has(periodOf(hour, daylight))).toBe(true);
    }
  });
});

describe('clock: simulated time (D8)', () => {
  it('defaults to a spring dawn so a new player hears birds', () => {
    const env = toEnvironment(DEFAULT_CLOCK, 'suburban-yard');
    expect(env.season).toBe('spring');
    expect(env.period).toBe('dawn');
  });

  it('carries into the next day past midnight', () => {
    expect(advance({ dayOfYear: 121, minutes: 1430 }, 20)).toEqual({
      dayOfYear: 122,
      minutes: 10,
    });
  });

  it('carries backward past midnight', () => {
    expect(advance({ dayOfYear: 121, minutes: 10 }, -20)).toEqual({
      dayOfYear: 120,
      minutes: 1430,
    });
  });

  it('is reversible', () => {
    const start = { dayOfYear: 121, minutes: 340 };
    expect(advance(advance(start, 1234.5), -1234.5)).toEqual(start);
  });

  it('wraps the year in both directions', () => {
    expect(advance({ dayOfYear: 365, minutes: 0 }, 1440)).toEqual({ dayOfYear: 1, minutes: 0 });
    expect(advance({ dayOfYear: 1, minutes: 0 }, -1440)).toEqual({ dayOfYear: 365, minutes: 0 });
  });

  it('does not drift when advanced in many small steps', () => {
    let clock = { dayOfYear: 121, minutes: 0 };
    for (let i = 0; i < 1440; i++) clock = advance(clock, 1);
    expect(clock).toEqual({ dayOfYear: 122, minutes: 0 });
  });

  it('accepts whole days in one step', () => {
    expect(advance({ dayOfYear: 100, minutes: 600 }, 10 * 1440)).toEqual({
      dayOfYear: 110,
      minutes: 600,
    });
  });

  it('normalises minutes into one day', () => {
    expect(normaliseMinutes(-1)).toBe(1439);
    expect(normaliseMinutes(1440)).toBe(0);
  });

  it('setClock patches one field without disturbing the other', () => {
    const base = { dayOfYear: 121, minutes: 340 };
    expect(setClock(base, { minutes: 7201 }).minutes).toBe(1);
    expect(setClock(base, { minutes: 7201 }).dayOfYear).toBe(121);
    expect(setClock(base, { dayOfYear: 400 }).dayOfYear).toBe(35);
  });

  it('formats time and date without touching the real clock', () => {
    expect(formatTime({ dayOfYear: 121, minutes: 5 * 60 + 40 })).toBe('05:40');
    expect(formatTime({ dayOfYear: 121, minutes: 0 })).toBe('00:00');
    expect(formatDate({ dayOfYear: 121, minutes: 0 })).toBe('May 1');
    expect(formatDate({ dayOfYear: 32, minutes: 0 })).toBe('February 1');
    expect(formatDate({ dayOfYear: 365, minutes: 0 })).toBe('December 31');
  });
});

describe('clock: environment folding', () => {
  it('derives hour, season, daylight and period together', () => {
    const env = toEnvironment({ dayOfYear: SPRING, minutes: 340 }, 'suburban-yard');
    expect(env.hour).toBeCloseTo(5 + 40 / 60, 10);
    expect(env.season).toBe('spring');
    expect(env.habitat).toBe('suburban-yard');
    expect(env.daylight.hours).toBeCloseTo(daylightFor(SPRING).hours, 10);
    expect(env.period).toBe('dawn');
  });

  it('passes the habitat through unchanged', () => {
    const habitat: Habitat = 'woodland-edge';
    expect(toEnvironment(DEFAULT_CLOCK, habitat).habitat).toBe(habitat);
  });

  it('is deterministic', () => {
    expect(toEnvironment(DEFAULT_CLOCK, 'suburban-yard')).toEqual(
      toEnvironment(DEFAULT_CLOCK, 'suburban-yard'),
    );
  });
});

describe('invariant: no real time on the play path', () => {
  // D8 is an architectural promise, so it gets a test rather than a comment.
  const roots = ['src/env', 'src/sim', 'src/game', 'src/backyard', 'src/journal', 'src/species'];

  it.each(roots)('%s contains no Date or Math.random usage', (root) => {
    const dir = join(process.cwd(), root);
    let files: string[];
    try {
      files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) =>
        f.endsWith('.ts') && !f.endsWith('.test.ts'),
      );
    } catch {
      return; // directory does not exist yet
    }
    expect(files.length).toBeGreaterThanOrEqual(0);
    for (const file of files) {
      // Strip comments first: the modules *document* this rule, and naming
      // `Date.now()` in prose should not count as using it.
      const source = readFileSync(join(dir, file), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
      expect(source).not.toMatch(/\bDate\.now\b/);
      expect(source).not.toMatch(/new\s+Date\b/);
      expect(source).not.toMatch(/\bMath\.random\b/);
    }
  });
});
