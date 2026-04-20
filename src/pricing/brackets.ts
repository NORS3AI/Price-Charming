/**
 * Combined-potency → max-price brackets from the spec.
 * Each entry says: "if combined potency is >= minPotency, you may charge
 * up to maxPrice gold for this potion type."
 */
export interface PriceBracket {
  minPotency: number;
  maxPrice: number;
}

/** Brackets in ascending order. The last entry is the price cap. */
export const PRICE_BRACKETS: readonly PriceBracket[] = Object.freeze([
  { minPotency: 1, maxPrice: 1 },
  { minPotency: 9, maxPrice: 2 },
  { minPotency: 17, maxPrice: 3 },
  { minPotency: 25, maxPrice: 4 },
  { minPotency: 33, maxPrice: 5 },
  { minPotency: 41, maxPrice: 6 },
  { minPotency: 51, maxPrice: 7 },
  { minPotency: 63, maxPrice: 8 },
] as const);

/** The minimum price the player can ever set when at least one hireling sells the type. */
export const MIN_PRICE = 1;

/** The hard cap on the per-potion price. */
export const MAX_PRICE = PRICE_BRACKETS[PRICE_BRACKETS.length - 1].maxPrice;

/** Combined potency at which the price is capped. */
export const CAP_POTENCY = PRICE_BRACKETS[PRICE_BRACKETS.length - 1].minPotency;

/**
 * Maximum price allowed for a given combined potency. Returns 0 when
 * combined potency is 0 (no hireling carries the type — there's nothing
 * to price). The spec only defines brackets from potency 1 upward.
 */
export function maxPriceForPotency(combinedPotency: number): number {
  if (combinedPotency <= 0) return 0;
  let max = MIN_PRICE;
  for (const bracket of PRICE_BRACKETS) {
    if (combinedPotency >= bracket.minPotency) max = bracket.maxPrice;
  }
  return max;
}

/**
 * Additional potency needed to reach the next bracket. Returns null when
 * combined potency has reached the cap (no further bracket exists).
 */
export function potencyToNextBracket(combinedPotency: number): number | null {
  for (const bracket of PRICE_BRACKETS) {
    if (combinedPotency < bracket.minPotency) {
      return bracket.minPotency - combinedPotency;
    }
  }
  return null;
}
