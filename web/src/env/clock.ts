import type { Environment, Habitat } from './types.js';
import { daylightFor, normaliseDay, seasonOf, DAYS_IN_YEAR } from './season.js';
import { periodOf } from './period.js';

/**
 * The simulated clock (decision D8).
 *
 * Birdie never reads the device clock. There is no `Date.now()` and no `new Date()`
 * anywhere on the play path, and nothing in this module can accidentally start
 * depending on real time. The player's simulated position in the year and the day
 * is *saved state*, so a saved game restores to the same morning it was left in.
 *
 * The consequence stated in the plan: silence is always something the player can
 * see on screen (the current hour and season are displayed), never an accident of
 * when they opened the app.
 */

export interface SimulatedClock {
  /** 1–365, non-leap. */
  readonly dayOfYear: number;
  /** Minutes since simulated midnight, 0 ≤ m < 1440. May be fractional. */
  readonly minutes: number;
}

export const MINUTES_PER_DAY = 1440;
export const MINUTES_PER_HOUR = 60;

/**
 * First-run clock: 1 May, 05:40. Chosen so a new player hears a spring dawn
 * chorus immediately rather than being told to wait.
 */
export const DEFAULT_CLOCK: SimulatedClock = { dayOfYear: 121, minutes: 5 * 60 + 40 };

/** Normalise minutes into [0, 1440). */
export function normaliseMinutes(minutes: number): number {
  return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/**
 * Move the clock by an arbitrary signed number of minutes, carrying into days.
 * Accepts fractional minutes so a day dial can scrub smoothly.
 */
export function advance(clock: SimulatedClock, deltaMinutes: number): SimulatedClock {
  const total = clock.minutes + deltaMinutes;
  const dayShift = Math.floor(total / MINUTES_PER_DAY);
  return {
    dayOfYear: normaliseDay(clock.dayOfYear + dayShift),
    minutes: normaliseMinutes(total),
  };
}

/** Set the clock to an explicit position, normalising both fields. */
export function setClock(clock: SimulatedClock, next: Partial<SimulatedClock>): SimulatedClock {
  const dayOfYear = next.dayOfYear === undefined ? clock.dayOfYear : normaliseDay(next.dayOfYear);
  const minutes =
    next.minutes === undefined ? clock.minutes : normaliseMinutes(next.minutes);
  return { dayOfYear, minutes };
}

/** Wall-clock rendering for the UI. Always shown, per D8. */
export function formatTime(clock: SimulatedClock): string {
  const total = Math.floor(normaliseMinutes(clock.minutes));
  const hh = Math.floor(total / MINUTES_PER_HOUR);
  const mm = total % MINUTES_PER_HOUR;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** Month name + day, without touching `Date` (which would drag in real time). */
const MONTH_STARTS: ReadonlyArray<readonly [string, number]> = [
  ['January', 1],
  ['February', 32],
  ['March', 60],
  ['April', 91],
  ['May', 121],
  ['June', 152],
  ['July', 182],
  ['August', 213],
  ['September', 244],
  ['October', 274],
  ['November', 305],
  ['December', 335],
];

export function formatDate(clock: SimulatedClock): string {
  const day = normaliseDay(clock.dayOfYear);
  let month = MONTH_STARTS[0]!;
  for (const entry of MONTH_STARTS) {
    if (day >= entry[1]) month = entry;
    else break;
  }
  const [name, start] = month;
  return `${name} ${day - start + 1}`;
}

/** Fold the clock into the environment every other module consumes. */
export function toEnvironment(clock: SimulatedClock, habitat: Habitat): Environment {
  const daylight = daylightFor(clock.dayOfYear);
  const hour = normaliseMinutes(clock.minutes) / MINUTES_PER_HOUR;
  return {
    hour,
    season: seasonOf(clock.dayOfYear),
    habitat,
    daylight,
    period: periodOf(hour, daylight),
  };
}

/** Days in the simulated year, re-exported so callers need one import. */
export { DAYS_IN_YEAR };
