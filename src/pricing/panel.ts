import { Board, HirelingInstance } from "../board/types";
import { PotionTypeId } from "../potions/types";
import {
  CAP_VALUE,
  MIN_PRICE,
  amountToNextBracket,
  maxPriceForStatValue,
} from "./brackets";
import { combinedPotencyMap, combinedStockMap } from "./potency";

/** Player-set price per active potion type. */
export interface PriceMap {
  prices: ReadonlyMap<PotionTypeId, number>;
}

/** Status text the pricing panel shows beneath each potion type. */
export type PricingStatus =
  | { kind: "below-cap"; amountToNextTier: number; limitingStat: "stock" | "potency" }
  | { kind: "at-cap" }
  | { kind: "no-stock" };

/** A single row of the shop-phase pricing panel. */
export interface PricingPanelEntry {
  potionType: PotionTypeId;
  /** Summed potency across active-slot hirelings selling this type. */
  combinedPotency: number;
  /** Summed stock across active-slot hirelings selling this type. */
  combinedStock: number;
  /**
   * max(combinedStock, combinedPotency) — the value used to pick the
   * price bracket. Either stat can unlock the tier.
   */
  tierValue: number;
  /** Player's stored price (raw, may exceed currentMax if the board changed). */
  storedPrice: number;
  /** Effective price actually used by sales — clamped to [MIN_PRICE, currentMax]. */
  effectivePrice: number;
  /** Highest price the player can currently set for this type. */
  currentMax: number;
  status: PricingStatus;
}

/** Build a fresh price map with every active type defaulted to MIN_PRICE. */
export function defaultPriceMap(
  activeTypes: readonly PotionTypeId[]
): PriceMap {
  const prices = new Map<PotionTypeId, number>();
  for (const type of activeTypes) prices.set(type, MIN_PRICE);
  return { prices };
}

/**
 * Set the price for a single potion type. Clamps to [MIN_PRICE, maxAllowed]
 * — passing a `maxAllowed` taken from the current panel ensures the
 * player can never exceed their bracket. Returns a new PriceMap.
 */
export function setPrice(
  prices: PriceMap,
  type: PotionTypeId,
  price: number,
  maxAllowed: number
): PriceMap {
  if (!prices.prices.has(type)) {
    throw new Error(`Potion type "${type}" is not in the price map.`);
  }
  if (!Number.isInteger(price)) {
    throw new Error(`Price must be an integer (got ${price}).`);
  }
  const clamped = Math.max(MIN_PRICE, Math.min(maxAllowed, price));
  const next = new Map(prices.prices);
  next.set(type, clamped);
  return { prices: next };
}

/** Look up the stored price for a type; defaults to MIN_PRICE. */
export function priceFor(prices: PriceMap, type: PotionTypeId): number {
  return prices.prices.get(type) ?? MIN_PRICE;
}

/**
 * Build the pricing-panel rows from active types, current board, and the
 * player's stored prices. Computes combined potency, current-max, status,
 * and an effective price clamped to the bracket so callers can use it
 * directly when ringing up a sale.
 */
export function buildPricingPanel(
  activeTypes: readonly PotionTypeId[],
  board: Board,
  prices: PriceMap
): PricingPanelEntry[] {
  const potencies = combinedPotencyMap(board, activeTypes);
  const stocks = combinedStockMap(board, activeTypes);
  return activeTypes.map((type) => {
    const combinedPotency = potencies.get(type) ?? 0;
    const combinedStock = stocks.get(type) ?? 0;
    // Bracket is unlocked by the LARGER of the two — stock OR potency.
    const tierValue = Math.max(combinedStock, combinedPotency);
    const currentMax = maxPriceForStatValue(tierValue);
    const stored = priceFor(prices, type);
    const effectivePrice =
      currentMax === 0 ? 0 : Math.max(MIN_PRICE, Math.min(currentMax, stored));

    let status: PricingStatus;
    if (tierValue === 0) {
      status = { kind: "no-stock" };
    } else if (tierValue >= CAP_VALUE) {
      status = { kind: "at-cap" };
    } else {
      // Tell the player WHICH stat is closest to the next tier so they
      // know where to invest (stock vs. potency). Whichever is higher
      // is the one that determined the current tier.
      const limitingStat: "stock" | "potency" =
        combinedStock >= combinedPotency ? "stock" : "potency";
      status = {
        kind: "below-cap",
        amountToNextTier: amountToNextBracket(tierValue)!,
        limitingStat,
      };
    }

    return {
      potionType: type,
      combinedPotency,
      combinedStock,
      tierValue,
      storedPrice: stored,
      effectivePrice,
      currentMax,
      status,
    };
  });
}

/**
 * Apply the per-hireling Haggle modifier to a ringing-up price: +3g per
 * sale. `basePrice` should be the effective (panel-clamped) price the
 * customer would otherwise pay — Haggle pushes above that, which may
 * exceed the 8g cap (the cap governs what the player can *set*; Haggle
 * is a separate per-hireling sale modifier). Haggle does not appear in
 * the pricing panel.
 */
export function applyHaggle(
  basePrice: number,
  hireling: HirelingInstance
): number {
  const hasHaggle = hireling.card.keywords.some((k) => k.name === "Haggle");
  return hasHaggle ? basePrice + 3 : basePrice;
}
