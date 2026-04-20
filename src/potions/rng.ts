/**
 * A random-number source. Returns a float in [0, 1) — matches Math.random.
 * Tests should pass a deterministic RNG (e.g. mulberry32) instead of
 * Math.random so outputs are reproducible.
 */
export type RNG = () => number;

/** Default RNG — just Math.random. */
export const defaultRng: RNG = Math.random;

/**
 * Small deterministic PRNG (mulberry32) for tests and replayable seeds.
 * https://gist.github.com/tommyettinger/46a3f47f31a6abc9651a3c8a4d91c7b5
 */
export function mulberry32(seed: number): RNG {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates shuffle that consumes an RNG and does not mutate input. */
export function shuffle<T>(items: readonly T[], rng: RNG): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Draw a uniform random element from a non-empty array. */
export function pick<T>(items: readonly T[], rng: RNG): T {
  if (items.length === 0) {
    throw new Error("pick() called on empty array.");
  }
  return items[Math.floor(rng() * items.length)];
}
