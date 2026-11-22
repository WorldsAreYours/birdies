import type { Environment } from '../env/types.js';
import type { SpeciesRecord, Stratum } from '../species/types.js';
import type { RateResult } from './types.js';

/**
 * vocalizationRate(record, env, stratum) — the central function of the simulation.
 *
 * Base rate for the period × seasonal presence × how well the placement suits the
 * bird. Nothing here is authored per bird in code: the numbers come from the
 * record, so adding a species never means touching this file. The unit of the
 * claim travels with the rate; the scheduler and the audio engine must not mix
 * an element event with a song clip.
 */

/**
 * Placement consequence (D10). Full rate in the bird's preferred stratum, halved
 * where it is tolerated, heavily reduced elsewhere. The player hears the mistake
 * before the journal explains it, which is the cheapest way to teach habitat.
 */
export const STRATUM_FACTORS = {
  preferred: 1,
  tolerated: 0.5,
  foreign: 0.15,
} as const;

/**
 * Seasonal presence. Breeding is the reference; `present` birds sing far less.
 * The 0.5 is a declared simplification, not a measurement — see the plan's rule
 * that a simplification you admit is education and one you hide is misinformation.
 */
export const SEASON_FACTORS = {
  breeding: 1,
  present: 0.5,
  absent: 0,
} as const;

export function stratumFactor(record: SpeciesRecord, stratum: Stratum): number {
  if (stratum === record.strata.preferred) return STRATUM_FACTORS.preferred;
  if (record.strata.tolerated.includes(stratum)) return STRATUM_FACTORS.tolerated;
  return STRATUM_FACTORS.foreign;
}

export function vocalizationRate(
  record: SpeciesRecord,
  env: Pick<Environment, 'season' | 'period'>,
  stratum: Stratum,
): RateResult {
  const presence = record.seasonality[env.season];
  if (presence === 'absent') return { perMinute: 0, confidence: 'none', unit: null };

  const claim = record.cadence[env.period];
  // No figure for this period: we do not know, so we do not play. Silence with
  // `none` is visibly different in the UI from silence we are sure about.
  if (!claim) return { perMinute: 0, confidence: 'none', unit: null };

  const perMinute = claim.perMinute * SEASON_FACTORS[presence] * stratumFactor(record, stratum);

  return {
    perMinute,
    confidence:
      claim.method === 'simplified' ? 'simplified' : claim.method === 'counted' ? 'counted' : 'sourced',
    unit: claim.unit,
  };
}

/** Expected number of vocalisations over a horizon. Used by tests and by the UI. */
export function expectedEvents(record: SpeciesRecord, env: Pick<Environment, 'season' | 'period'>, stratum: Stratum, horizonSeconds: number): number {
  return (vocalizationRate(record, env, stratum).perMinute / 60) * horizonSeconds;
}
