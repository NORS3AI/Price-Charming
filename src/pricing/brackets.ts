/**
 * Combined-stat → max-price brackets from the spec. The bracket is
 * unlocked by max(combined stock, combined potency) across all
 * active-slot hirelings selling a given potion type — either stat is
 * enough to hit the tier. Each entry says: "if max(stock, potency) is
 * >= minValue, you may charge up to maxPrice gold for this potion."
 */
export interface PriceBracket {
  minValue: number;
  maxPrice: number;
}

/** Brackets in ascending order. The last entry is the price cap. */
export const PRICE_BRACKETS: readonly PriceBracket[] = Object.freeze([
  { minValue: 1, maxPrice: 1 },
  { minValue: 9, maxPrice: 2 },
  { minValue: 17, maxPrice: 3 },
  { minValue: 25, maxPrice: 4 },
  { minValue: 33, maxPrice: 5 },
  { minValue: 41, maxPrice: 6 },
  { minValue: 51, maxPrice: 7 },
  { minValue: 63, maxPrice: 8 },
] as const);

/** The minimum price the player can ever set when at least one hireling sells the type. */
export const MIN_PRICE = 1;

/** The hard cap on the per-potion price. */
export const MAX_PRICE = PRICE_BRACKETS[PRICE_BRACKETS.length - 1].maxPrice;

/** Tier value (in either stock or potency) at which the price is capped. */
export const CAP_VALUE = PRICE_BRACKETS[PRICE_BRACKETS.length - 1].minValue;

/**
 * Maximum price allowed for a given combined-stat value. Pass in
 * `max(combined stock, combined potency)`. Returns 0 when the value is
 * 0 (no hireling carries the type — nothing to price). The spec only
 * defines brackets from value 1 upward.
 */
export function maxPriceForStatValue(combinedStat: number): number {
  if (combinedStat <= 0) return 0;
  let max = MIN_PRICE;
  for (const bracket of PRICE_BRACKETS) {
    if (combinedStat >= bracket.minValue) max = bracket.maxPrice;
  }
  return max;
}

/**
 * Additional stat value needed to reach the next bracket. Returns null
 * when the value has reached the cap (no further bracket exists).
 */
export function amountToNextBracket(combinedStat: number): number | null {
  for (const bracket of PRICE_BRACKETS) {
    if (combinedStat < bracket.minValue) {
      return bracket.minValue - combinedStat;
    }
  }
  return null;
}

// Back-compat aliases so older import sites keep compiling. Prefer the
// new names above — the pricing panel now unlocks on max(stock, potency).
export const maxPriceForPotency = maxPriceForStatValue;
export const potencyToNextBracket = amountToNextBracket;
export const CAP_POTENCY = CAP_VALUE;
