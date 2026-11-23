import type { VocalizationEvent } from './types.js';

/**
 * The look-ahead window.
 *
 * The audio engine cannot schedule an event it has not been told about, and it
 * cannot afford to schedule a hundred at once. This picks the slice due in the
 * next moment: pure, so the scheduling policy is testable without a sound card.
 *
 * Half-open interval [fromSeconds, toSeconds): an event exactly on the boundary is
 * picked up by the next window, never by both, so nothing plays twice.
 */
export function windowEvents(
  events: readonly VocalizationEvent[],
  fromSeconds: number,
  toSeconds: number,
): VocalizationEvent[] {
  if (toSeconds <= fromSeconds) return [];
  return events.filter((event) => event.atSeconds >= fromSeconds && event.atSeconds < toSeconds);
}

/**
 * The next horizon to simulate, given how far the clock has run.
 *
 * Keeps a rolling window of schedule ahead of the playhead so a long session does
 * not hold every event in memory. Extending the horizon only appends events: each
 * bird's schedule depends on the seed and its index alone (see `simulate`).
 */
export function nextHorizon(elapsedSeconds: number, lookAheadSeconds: number): number {
  return Math.max(0, elapsedSeconds) + Math.max(0, lookAheadSeconds);
}
