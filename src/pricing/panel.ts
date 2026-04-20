import { Board, HirelingInstance } from "../board/types";
import { PotionTypeId } from "../potions/types";
import {
  CAP_POTENCY,
  MIN_PRICE,
  maxPriceForPotency,
  potencyToNextBracket,
} from "./brackets";
import { combinedPotencyMap } from "./potency";

/** Player-set price per active potion type. */
export interface PriceMap {
  prices: ReadonlyMap<PotionTypeId, number>;
}

/** Status text the pricing panel shows beneath each potion type. */
export type PricingStatus =
  | { kind: "below-cap"; potencyToNextTier: number }
  | { kind: "at-cap" }
  | { kind: "no-stock" };

/** A single row of the shop-phase pricing panel. */
export interface PricingPanelEntry {
  potionType: PotionTypeId;
  combinedPotency: number;
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
  return activeTypes.map((type) => {
    const combinedPotency = potencies.get(type) ?? 0;
    const currentMax = maxPriceForPotency(combinedPotency);
    const stored = priceFor(prices, type);
    const effectivePrice =
      currentMax === 0 ? 0 : Math.max(MIN_PRICE, Math.min(currentMax, stored));

    let status: PricingStatus;
    if (combinedPotency === 0) {
      status = { kind: "no-stock" };
    } else if (combinedPotency >= CAP_POTENCY) {
      status = { kind: "at-cap" };
    } else {
      status = {
        kind: "below-cap",
        potencyToNextTier: potencyToNextBracket(combinedPotency)!,
      };
    }

    return {
      potionType: type,
      combinedPotency,
      storedPrice: stored,
      effectivePrice,
      currentMax,
      status,
    };
  });
}

/**
 * Apply the per-hireling Haggle modifier to a panel price: +3g per sale.
 * Haggle does not appear in the pricing panel; it's resolved when a
 * specific hireling rings up a customer.
 */
export function applyHaggle(
  panelPrice: number,
  hireling: HirelingInstance
): number {
  const hasHaggle = hireling.card.keywords.some((k) => k.name === "Haggle");
  return hasHaggle ? panelPrice + 3 : panelPrice;
}
