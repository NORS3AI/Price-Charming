import { activeHirelings } from "../board/board";
import { Board, HirelingInstance } from "../board/types";
import { PotionTypeId } from "../potions/types";

/**
 * Sum of potency across all active-slot hirelings that currently sell a
 * given potion type. Bench hirelings are excluded per the spec —
 * they don't cast or contribute passively during the action phase.
 *
 * A hireling contributes the potency of the CSV potion slot that
 * matches its assigned `potionType`. Two-potion hirelings only
 * contribute the slot that corresponds to their assigned type.
 *
 * NOTE: cards.csv doesn't tag individual potion slots with type ids —
 * the spec treats each hireling as selling a single active potion type.
 * Until multi-potion hirelings ship, we sum the first potion slot's
 * potency for simplicity. Two-slot hirelings will need richer modeling
 * when per-slot type assignment lands.
 */
export function combinedPotencyForType(
  hirelings: readonly HirelingInstance[],
  type: PotionTypeId
): number {
  let total = 0;
  for (const h of hirelings) {
    // Slot 0 contributes when its assigned type matches.
    if (h.potionType === type) {
      const slot0 = h.card.potions[0];
      if (slot0) total += slot0.potency + h.permanentPotencyBonus;
    }
    // Slot 1 contributes when its assigned type matches.
    if (h.potionType2 === type) {
      const slot1 = h.card.potions[1];
      if (slot1) total += slot1.potency + h.permanentPotencyBonus2;
    }
  }
  return total;
}

/**
 * Sum of stock across all active-slot hirelings that currently sell a
 * given potion type. Mirrors `combinedPotencyForType` but walks the
 * stock field. Includes permanent stock bonus; temporary Quickcraft
 * stock is NOT counted here — pricing tiers are set at the START of
 * the shop phase and reflect the durable potion capacity the player
 * has built up, not transient in-round buffs.
 */
export function combinedStockForType(
  hirelings: readonly HirelingInstance[],
  type: PotionTypeId
): number {
  let total = 0;
  for (const h of hirelings) {
    if (h.potionType === type) {
      const slot0 = h.card.potions[0];
      if (slot0) total += slot0.stock + h.permanentStockBonus;
    }
    if (h.potionType2 === type) {
      const slot1 = h.card.potions[1];
      if (slot1) total += slot1.stock + h.permanentStockBonus2;
    }
  }
  return total;
}

/** Convenience: combined potency per type across the active slots only. */
export function combinedPotencyFromBoard(
  board: Board,
  type: PotionTypeId
): number {
  return combinedPotencyForType(activeHirelings(board), type);
}

/**
 * Shorthand: a map of every active type to its combined potency on the
 * board's active slots. Types with zero contributing hirelings map to 0.
 */
export function combinedPotencyMap(
  board: Board,
  activeTypes: readonly PotionTypeId[]
): Map<PotionTypeId, number> {
  const hirelings = activeHirelings(board);
  const result = new Map<PotionTypeId, number>();
  for (const type of activeTypes) {
    result.set(type, combinedPotencyForType(hirelings, type));
  }
  return result;
}

/** Parallel to combinedPotencyMap for stock. */
export function combinedStockMap(
  board: Board,
  activeTypes: readonly PotionTypeId[]
): Map<PotionTypeId, number> {
  const hirelings = activeHirelings(board);
  const result = new Map<PotionTypeId, number>();
  for (const type of activeTypes) {
    result.set(type, combinedStockForType(hirelings, type));
  }
  return result;
}
