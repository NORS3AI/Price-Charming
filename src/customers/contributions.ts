import { HirelingInstance } from "../board/types";
import { AxisKind, Customer } from "./types";

/**
 * Per-axis contribution rates for passive hirelings. These are the
 * "units per second" a single active-slot hireling adds to its side's
 * bar. Tunable — Phase 7's action-round ticker multiplies by tick
 * duration when advancing bars.
 *
 * The spec defines the qualitative leans:
 *   - Stock → Focus (well-stocked stall draws attention)
 *   - Potency → Quality (good product speaks for itself)
 *   - Set price → Budget (always visible)
 *   - Potion type → Type (binary; fills it or doesn't)
 *
 * Rates below are starting values; balancing can tune them later.
 */
export const PASSIVE_RATES = Object.freeze({
  /** Focus contribution per unit of stock per second. */
  focusPerStock: 0.5,
  /** Quality contribution per unit of potency per second. */
  qualityPerPotency: 1.0,
  /**
   * Budget contribution per second when the hireling's price fits in the
   * customer's budget. Subtracted when over-budget.
   */
  budgetFitPerSecond: 2.0,
  budgetOverPerSecond: 1.5,
  /** Type contribution per second when the hireling sells the desired type. */
  typeMatchPerSecond: 4.0,
});

/** One hireling's passive contribution for this customer, per second. */
export interface PassiveContribution {
  focus: number;
  type: number;
  budget: number;
  quality: number;
}

/**
 * Compute the per-second passive contribution a single hireling makes
 * toward winning this customer, given the customer and the hireling's
 * current posted price. Returns non-negative numbers only — negative
 * contributions (e.g. over-budget) can be subtracted from the opposite
 * axis by the caller.
 *
 * Stock contribution uses the hireling's CSV-printed base stock. Phase 7
 * will layer in live stock (including temporary Quickcraft stock).
 */
export function computePassiveContribution(
  hireling: HirelingInstance,
  panelPrice: number,
  customer: Customer
): PassiveContribution {
  // Pick whichever slot's potion type matches the customer (slot 0
  // primary, slot 1 secondary for two-potion hirelings). When the
  // customer wants neither, all contributions are 0.
  let baseStock = 0;
  let potency = 0;
  let typeMatches = false;
  if (hireling.potionType === customer.desiredType) {
    baseStock = (hireling.card.potions[0]?.stock ?? 0) + hireling.permanentStockBonus;
    potency = (hireling.card.potions[0]?.potency ?? 0) + hireling.permanentPotencyBonus;
    typeMatches = true;
  } else if (hireling.potionType2 === customer.desiredType) {
    baseStock = (hireling.card.potions[1]?.stock ?? 0) + hireling.permanentStockBonus2;
    potency = (hireling.card.potions[1]?.potency ?? 0) + hireling.permanentPotencyBonus2;
    typeMatches = true;
  }

  return {
    focus: typeMatches ? baseStock * PASSIVE_RATES.focusPerStock : 0,
    type: typeMatches ? PASSIVE_RATES.typeMatchPerSecond : 0,
    budget: typeMatches && panelPrice <= customer.budget
      ? PASSIVE_RATES.budgetFitPerSecond
      : 0,
    quality:
      typeMatches && potency >= customer.qualityThreshold
        ? potency * PASSIVE_RATES.qualityPerPotency
        : 0,
  };
}

/**
 * The "over-budget" drain on the Budget axis — a hireling whose price
 * exceeds the customer's budget slowly PUSHES the Budget bar toward the
 * opposite side. Returned as a positive number; the action-round engine
 * adds it to the opponent's side when the player's hireling is the
 * over-budget one (or vice versa).
 */
export function overBudgetPressure(
  hireling: HirelingInstance,
  panelPrice: number,
  customer: Customer
): number {
  const typeMatches =
    hireling.potionType === customer.desiredType ||
    hireling.potionType2 === customer.desiredType;
  if (!typeMatches) return 0;
  return panelPrice > customer.budget ? PASSIVE_RATES.budgetOverPerSecond : 0;
}

/** Axis kinds visible on a PassiveContribution, in canonical order. */
export function contributionToAxes(
  c: PassiveContribution
): Record<AxisKind, number> {
  return { focus: c.focus, type: c.type, budget: c.budget, quality: c.quality };
}
