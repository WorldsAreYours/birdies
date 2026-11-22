import type { Daylight, Season } from './types.js';

/**
 * Season and daylight derivation from a day of the year.
 *
 * SIMPLIFICATION, stated plainly (the plan requires simplifications be admitted):
 * - Latitude is fixed at 42°N, a Midwest reference. Birdie v1 has one yard.
 * - Daylight uses the standard solar-declination approximation (Cooper) on solar
 *   time. It ignores the equation of time, longitude within the time zone, and
 *   daylight saving. Error is on the order of ±15 minutes, which is below the
 *   resolution of any cadence data we hold.
 * - The year is treated as 365 days; leap days are not modelled.
 *
 * None of this is ornithology. It is the maths that decides when "dawn" is, so
 * that the birds' behaviour can be stated against a defensible clock.
 */

export const DAYS_IN_YEAR = 365;
export const REFERENCE_LATITUDE_DEG = 42;

const DEG = Math.PI / 180;

/**
 * Solar declination in degrees for a day of the year (Cooper's equation).
 * Range ±23.44°, peaking at the June solstice (day 172).
 */
export function solarDeclination(dayOfYear: number): number {
  return 23.44 * Math.sin((2 * Math.PI * (284 + dayOfYear)) / DAYS_IN_YEAR);
}

/** Day-of-year bounds for the meteorological seasons. Non-leap calendar. */
const SEASON_BOUNDS: ReadonlyArray<readonly [Season, number, number]> = [
  ['winter', 335, 365],
  ['winter', 1, 59],
  ['spring', 60, 151],
  ['summer', 152, 243],
  ['fall', 244, 334],
];

export function seasonOf(dayOfYear: number): Season {
  const day = normaliseDay(dayOfYear);
  for (const [season, from, to] of SEASON_BOUNDS) {
    if (day >= from && day <= to) return season;
  }
  // Unreachable: the bounds cover 1–365 contiguously.
  throw new Error(`day of year out of range: ${dayOfYear}`);
}

/** Wrap any integer day number into 1–365. */
export function normaliseDay(dayOfYear: number): number {
  return (((Math.round(dayOfYear) - 1) % DAYS_IN_YEAR) + DAYS_IN_YEAR) % DAYS_IN_YEAR + 1;
}

/**
 * Sunrise, sunset and daylight hours for a day of the year at a latitude.
 * Returned in solar time, so 12:00 is solar noon by construction.
 */
export function daylightFor(
  dayOfYear: number,
  latitudeDeg: number = REFERENCE_LATITUDE_DEG,
): Daylight {
  const declination = solarDeclination(normaliseDay(dayOfYear)) * DEG;
  const latitude = latitudeDeg * DEG;

  // Clamp for polar day/night, where the argument leaves [-1, 1].
  const cosHourAngle = -Math.tan(latitude) * Math.tan(declination);
  const hourAngle = Math.acos(Math.min(1, Math.max(-1, cosHourAngle)));

  const hours = (2 * hourAngle) / DEG / 15;
  return { sunrise: 12 - hours / 2, sunset: 12 + hours / 2, hours };
}
