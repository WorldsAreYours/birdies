import type { Environment } from '../env/types.js';
import type { SongVariant } from '../species/types.js';
import { mulberry32 } from './random.js';
import { songsPerMinute } from './rate.js';
import type { PlacedBird, SimulationOptions, VocalizationEvent } from './types.js';
import { pickVariant } from './variants.js';

/**
 * simulate(env, birds, { seed, horizon }) → events
 *
 * A seeded Poisson process per bird: exponential inter-arrival times at a rate
 * derived from the species record. Deterministic for a seed, which is what makes
 * realism testable instead of a matter of taste. Nothing is pre-scripted, so the
 * same yard never sounds the same twice — and a yard where the data says "absent"
 * stays genuinely silent.
 *
 * Songs only. Calls belong to a different mechanic (contact, alarm) and mixing
 * them into the chorus would blur two things birders distinguish.
 */
export function simulate(
  env: Environment,
  birds: readonly PlacedBird[],
  options: SimulationOptions,
): VocalizationEvent[] {
  const { seed, horizonSeconds } = options;
  if (horizonSeconds <= 0) return [];

  const rng = mulberry32(seed);
  const events: VocalizationEvent[] = [];
  let sequence = 0;

  for (const bird of birds) {
    const { perMinute } = songsPerMinute(bird.record, env, bird.stratum);
    if (perMinute <= 0) continue;

    const lambda = perMinute / 60; // events per second
    let lastVariantId: string | null = null;

    // First arrival: exponential, drawn from the same stream so the whole yard
    // is reproducible from one seed.
    let at = -Math.log(1 - rng()) / lambda;

    while (at < horizonSeconds) {
      const variant: SongVariant | null = pickVariant(bird.record.songs, rng, lastVariantId);
      if (variant) {
        lastVariantId = variant.id;
        events.push({
          atSeconds: at,
          speciesId: bird.record.id,
          variantId: variant.id,
          songTypeName: variant.songTypeName,
          clip: variant.clip,
          stratum: bird.stratum,
          sequence: sequence++,
        });
      }

      at += -Math.log(1 - rng()) / lambda;
    }
  }

  // Sorted by time, ties broken by generation order so the result is stable.
  return events.sort((a, b) => a.atSeconds - b.atSeconds || a.sequence - b.sequence);
}
