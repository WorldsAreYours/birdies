import type { Rng } from './random.js';

/**
 * Which song type plays next.
 *
 * Real birds repeat themselves, but hearing the *same recording* twice in a row is
 * a playback artifact, so an immediate repeat is forbidden whenever there is an
 * alternative. Uniform selection: we hold no per-type weight data yet, and
 * inventing weights would be exactly the kind of unsourced number the species
 * records exist to keep out.
 */
export function pickVariant<T extends { readonly id: string }>(
  variants: readonly T[],
  rng: Rng,
  lastId: string | null = null,
): T | null {
  if (variants.length === 0) return null;

  const candidates = variants.filter((variant) => variant.id !== lastId);
  // A single-variant repertoire has no alternative, so repetition is correct
  // there rather than an error.
  const pool = candidates.length > 0 ? candidates : variants;
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length));

  return pool[index] ?? null;
}
