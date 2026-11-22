import type { Daylight, Period } from './types.js';

/**
 * Time-of-day buckets, derived from the clock and the day's daylight window.
 *
 * The lead/tail offsets encode the one thing every birder knows and every
 * cadence table assumes: the dawn chorus begins *before* sunrise and stops
 * shortly after it. Values are a v1 simplification, not measured data, and are
 * named here so they can be tuned in one place once we hold real figures.
 */

/** Dawn is considered open this long before sunrise. */
export const DAWN_LEAD_HOURS = 1;
/** Dawn is considered closed this long after sunrise. */
export const DAWN_TAIL_HOURS = 1;
/** Dusk opens this long before sunset. */
export const DUSK_LEAD_HOURS = 1;
/** Dusk closes this long after sunset. */
export const DUSK_TAIL_HOURS = 0.5;
/** Morning gives way to the wide `midday` bucket at this hour. */
export const MORNING_END_HOUR = 11;

export function periodOf(hour: number, daylight: Daylight): Period {
  const h = ((hour % 24) + 24) % 24;
  const dawnStart = daylight.sunrise - DAWN_LEAD_HOURS;
  const dawnEnd = daylight.sunrise + DAWN_TAIL_HOURS;
  const duskStart = daylight.sunset - DUSK_LEAD_HOURS;
  const duskEnd = daylight.sunset + DUSK_TAIL_HOURS;

  if (h < dawnStart || h >= duskEnd) return 'night';
  if (h < dawnEnd) return 'dawn';
  if (h < MORNING_END_HOUR) return 'morning';
  if (h < duskStart) return 'midday';
  return 'dusk';
}
