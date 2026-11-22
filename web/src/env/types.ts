/**
 * Shared environment vocabulary.
 *
 * Everything the simulation knows about "when and where" comes through these
 * types. They are plain data on purpose: the whole core is pure functions over
 * these values, which is what makes realism testable rather than vibes.
 */

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

/** v1 ships `suburban-yard` only. The others exist so records can declare tolerance. */
export type Habitat = 'suburban-yard' | 'woodland-edge' | 'wetland';

/**
 * Coarse time-of-day buckets that species cadence data is stated in.
 *
 * `midday` deliberately covers the whole post-morning daylight stretch up to
 * dusk, because published songs-per-minute figures are rarely finer than that.
 * Inventing an `afternoon` bucket would mean inventing numbers to fill it.
 */
export type Period = 'dawn' | 'morning' | 'midday' | 'dusk' | 'night';

export interface Daylight {
  /** Sunrise as a fractional hour on the 24h clock (solar time). */
  readonly sunrise: number;
  /** Sunset as a fractional hour on the 24h clock (solar time). */
  readonly sunset: number;
  /** Total daylight length in hours; always `sunset - sunrise`. */
  readonly hours: number;
}

export interface Environment {
  /** Fractional hour, 0–24. Never wall-clock time — see clock.ts. */
  readonly hour: number;
  readonly season: Season;
  readonly habitat: Habitat;
  readonly daylight: Daylight;
  /** Derived from `hour` + `daylight`; carried here so callers need not recompute. */
  readonly period: Period;
}
