import { HirelingCard } from "../cards/types";
import {
  LittlePiggy,
  Teacups,
  BigBadWolf,
  MadameTeapot,
} from "../cards/hirelings";

/**
 * Upgrade registry: maps a hireling id to the card it becomes
 * when 3 copies are merged.
 */
const upgradeRegistry = new Map<string, HirelingCard>();

function register(source: HirelingCard, result: HirelingCard) {
  upgradeRegistry.set(source.id, result);
}

// --- register the canonical upgrades from the game design ---
register(LittlePiggy, BigBadWolf);
register(Teacups, MadameTeapot);

/**
 * Returns true if a hireling has an upgrade path (3x merge).
 */
export function hasUpgrade(hireling: HirelingCard): boolean {
  return upgradeRegistry.has(hireling.id);
}

/**
 * Look up what a hireling upgrades into when 3 copies merge.
 * Returns `undefined` if no upgrade exists.
 */
export function getUpgradeResult(
  hireling: HirelingCard
): HirelingCard | undefined {
  return upgradeRegistry.get(hireling.id);
}

/**
 * Given a board (array of hirelings), check if any hireling appears 3+ times
 * and has an upgrade path. If so, remove the 3 copies and add the upgraded
 * card, returning the new board and the upgrade that occurred.
 *
 * Returns the new board as a fresh copy so the caller can replace state.
 */
export function applyUpgrade(
  board: HirelingCard[]
): { board: HirelingCard[]; upgraded: HirelingCard | null } {
  // Count occurrences
  const counts = new Map<string, number>();
  for (const h of board) {
    counts.set(h.id, (counts.get(h.id) || 0) + 1);
  }

  for (const [id, count] of counts) {
    if (count >= 3 && upgradeRegistry.has(id)) {
      const result = upgradeRegistry.get(id)!;
      // Remove 3 copies
      let removed = 0;
      const newBoard = board.filter((h) => {
        if (h.id === id && removed < 3) {
          removed++;
          return false;
        }
        return true;
      });
      // Add the upgrade (deep copy)
      newBoard.push({
        ...result,
        potions: result.potions.map((p) => ({ ...p })),
      });
      return { board: newBoard, upgraded: result };
    }
  }

  return { board: [...board], upgraded: null };
}

/**
 * Register a new upgrade path for extending the game.
 */
export function registerUpgrade(
  source: HirelingCard,
  result: HirelingCard
): void {
  register(source, result);
}
