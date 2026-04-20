import { RNG } from "../potions/rng";

/**
 * Inclusive range of units a customer purchases per interaction at a
 * given stock level (per spec: stock determines purchase volume, not
 * just whether a sale happens).
 */
export interface UnitsRange {
  min: number;
  max: number;
}

/** Stock → units-per-interaction range. */
export function unitsRange(stock: number): UnitsRange {
  if (stock <= 0) return { min: 0, max: 0 };
  if (stock <= 5) return { min: 1, max: 1 };
  if (stock <= 15) return { min: 1, max: 2 };
  if (stock <= 30) return { min: 2, max: 3 };
  return { min: 3, max: 4 };
}

/**
 * Roll the actual units sold this interaction. Honors the stock cap —
 * a hireling at 1 stock can never sell more than 1 unit even though
 * the bracket allows up to 4 at very high stock.
 */
export function rollUnitsPerInteraction(stock: number, rng: RNG): number {
  const { min, max } = unitsRange(stock);
  if (max === 0) return 0;
  const rolled = min + Math.floor(rng() * (max - min + 1));
  return Math.min(rolled, stock);
}
