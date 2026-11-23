import type { Environment } from '../env/types.js';
import type { SongVariant } from '../species/types.js';
import { mulberry32 } from './random.js';
import { vocalizationRate } from './rate.js';
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
 * Each bird draws from its own stream, derived from the seed and its index in
 * `birds`. A bird's events therefore depend only on those two things, never on the
 * horizon or on the other birds' draws, so extending the horizon appends events
 * and never rewrites the ones already scheduled.
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

  const tagged: { event: VocalizationEvent; birdIndex: number }[] = [];

  birds.forEach((bird, birdIndex) => {
    const { perMinute, unit } = vocalizationRate(bird.record, env, bird.stratum);
    if (perMinute <= 0 || unit === null) return;

    const rng = mulberry32(streamSeed(seed, birdIndex));
    const lambda = perMinute / 60; // events per second
    let lastVariantId: string | null = null;
    let sequence = 0;

    // First arrival: exponential, drawn from this bird's own stream.
    let at = -Math.log(1 - rng()) / lambda;

    while (at < horizonSeconds) {
      const variant: SongVariant | null = pickVariant(bird.record.songs, rng, lastVariantId);
      if (variant) {
        lastVariantId = variant.id;
        tagged.push({
          birdIndex,
          event: {
            atSeconds: at,
            speciesId: bird.record.id,
            variantId: variant.id,
            songTypeName: variant.songTypeName,
            clip: variant.clip,
            unit,
            stratum: bird.stratum,
            sequence: sequence++,
          },
        });
      }

      at += -Math.log(1 - rng()) / lambda;
    }
  });

  // Sorted by time. Ties go to the earlier bird, then to the earlier event of that
  // bird, so the order never depends on how far any other bird was simulated.
  tagged.sort(
    (a, b) =>
      a.event.atSeconds - b.event.atSeconds ||
      a.birdIndex - b.birdIndex ||
      a.event.sequence - b.event.sequence,
  );
  return tagged.map((entry) => entry.event);
}

/**
 * A per-bird seed from the yard seed and the bird's position. Multiplying by odd
 * constants and xoring spreads neighbouring indices apart before mulberry32 mixes
 * them further.
 */
function streamSeed(seed: number, index: number): number {
  return (Math.imul(seed ^ Math.imul(index + 1, 0x9e3779b9), 0x85ebca6b) ^ 0x27d4eb2d) >>> 0;
}
