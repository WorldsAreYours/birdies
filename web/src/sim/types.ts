import type { SpeciesId, SpeciesRecord, Stratum, VocalizationUnit } from '../species/types.js';

/** A bird the player has placed, and where they put it. */
export interface PlacedBird {
  readonly record: SpeciesRecord;
  readonly stratum: Stratum;
}

/**
 * One vocalisation, scheduled at a simulated time.
 *
 * Carries everything the audio engine and the visual pulse need, and nothing
 * about how it will sound — pan, gain and filtering are derived from `stratum`
 * by the audio layer, so the simulation stays pure and assertable.
 */
export interface VocalizationEvent {
  readonly atSeconds: number;
  readonly speciesId: SpeciesId;
  readonly variantId: string;
  readonly songTypeName: string;
  readonly clip: string;
  /** What this event represents; the clip must contain the same unit. */
  readonly unit: VocalizationUnit;
  readonly stratum: Stratum;
  /** Generation order, used to keep sorts stable and therefore deterministic. */
  readonly sequence: number;
}

export interface SimulationOptions {
  readonly seed: number;
  readonly horizonSeconds: number;
}

/**
 * A rate, plus how much of it is actually known.
 *
 * `sourced`     measured or published.
 * `counted`     counted by a script whose error rate is not yet measured.
 * `simplified`  a declared engineering figure standing in for missing data.
 * `none`        no figure for this period or this season — not the same as zero.
 *
 * The distinction exists so the UI can be honest about which silences and which
 * songs are informed.
 */
export interface RateResult {
  readonly perMinute: number;
  readonly confidence: 'sourced' | 'counted' | 'simplified' | 'none';
  /** `null` when there is no figure for this period or season. */
  readonly unit: VocalizationUnit | null;
}
