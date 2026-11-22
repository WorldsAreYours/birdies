/**
 * Seeded randomness.
 *
 * The core may not use `Math.random` (a test enforces it), because realism has to
 * be reproducible: "a robin produces no events at 02:00 in winter" is only a
 * meaningful assertion if the same seed always produces the same yard.
 *
 * mulberry32: small, fast, good enough for scheduling, and trivially portable —
 * which matters if a save is ever replayed on another device.
 */

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
