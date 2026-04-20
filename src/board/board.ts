import { SELL_VALUE } from "../economy/gold";
import { Board, Hand, HirelingInstance } from "./types";
import { addToHand, isHireling, removeFromHand } from "./hand";

/** Total board slots (5 active + 2 bench). */
export const BOARD_SIZE = 7;

/** 0-indexed bench slot positions — shown as 1 and 7 to the player. */
export const BENCH_SLOTS: readonly number[] = Object.freeze([0, 6]);

/** 0-indexed active slot positions — shown as 2..6 to the player. */
export const ACTIVE_SLOTS: readonly number[] = Object.freeze([1, 2, 3, 4, 5]);

/** Center active slot — where the starter Dusty Broom is pre-placed. */
export const STARTER_SLOT = 3;

/** Create a new, empty board. */
export function createBoard(): Board {
  return { slots: Array<null>(BOARD_SIZE).fill(null) };
}

/** True when the slot index is one of the two bench positions. */
export function isBenchSlot(slot: number): boolean {
  return BENCH_SLOTS.includes(slot);
}

/** True when the slot index is one of the five active positions. */
export function isActiveSlot(slot: number): boolean {
  return ACTIVE_SLOTS.includes(slot);
}

/** True when every slot on the board is occupied. */
export function isBoardFull(board: Board): boolean {
  return board.slots.every((s) => s !== null);
}

/** Index of the first empty slot, or null if the board is full. */
export function firstEmptySlot(board: Board): number | null {
  const i = board.slots.findIndex((s) => s === null);
  return i === -1 ? null : i;
}

/** Instances currently in the active slots (order preserved, nulls skipped). */
export function activeHirelings(board: Board): HirelingInstance[] {
  return ACTIVE_SLOTS.map((i) => board.slots[i]).filter(
    (h): h is HirelingInstance => h !== null
  );
}

/** Instances currently on the bench (order preserved, nulls skipped). */
export function benchHirelings(board: Board): HirelingInstance[] {
  return BENCH_SLOTS.map((i) => board.slots[i]).filter(
    (h): h is HirelingInstance => h !== null
  );
}

/** All instances on the board — active + bench — in slot order. */
export function allHirelings(board: Board): HirelingInstance[] {
  return board.slots.filter((h): h is HirelingInstance => h !== null);
}

function assertSlotInRange(slot: number): void {
  if (!Number.isInteger(slot) || slot < 0 || slot >= BOARD_SIZE) {
    throw new Error(
      `Slot index must be an integer in 0..${BOARD_SIZE - 1} (got ${slot}).`
    );
  }
}

/** Place an instance directly into a specific slot. Throws if occupied. */
export function placeHireling(
  board: Board,
  slot: number,
  instance: HirelingInstance
): Board {
  assertSlotInRange(slot);
  if (board.slots[slot] !== null) {
    throw new Error(`Slot ${slot} is already occupied.`);
  }
  const slots = board.slots.slice();
  slots[slot] = instance;
  return { slots };
}

/**
 * Play a hireling from the hand to a specific board slot. Returns the
 * updated hand and board. Throws if:
 *  - the hand index is out of bounds
 *  - the card in hand is a spell (spells can't be played to the board)
 *  - the target slot is out of range or already occupied
 */
export function playHirelingFromHand(
  board: Board,
  hand: Hand,
  handIndex: number,
  slot: number
): { board: Board; hand: Hand } {
  assertSlotInRange(slot);
  const card = hand.cards[handIndex];
  if (!card) {
    throw new Error(`No card at hand index ${handIndex}.`);
  }
  if (!isHireling(card)) {
    throw new Error(`Card at hand index ${handIndex} is not a hireling.`);
  }
  if (board.slots[slot] !== null) {
    throw new Error(`Slot ${slot} is already occupied.`);
  }

  const { hand: nextHand } = removeFromHand(hand, handIndex);
  const nextBoard = placeHireling(board, slot, card);
  return { board: nextBoard, hand: nextHand };
}

/**
 * Sell a hireling from the board. Returns the updated board, the removed
 * instance, and the sell value the caller should add to the player's gold.
 */
export function sellHirelingFromBoard(
  board: Board,
  slot: number
): { board: Board; sold: HirelingInstance; sellValue: number } {
  assertSlotInRange(slot);
  const sold = board.slots[slot];
  if (!sold) {
    throw new Error(`Slot ${slot} is empty — nothing to sell.`);
  }
  const slots = board.slots.slice();
  slots[slot] = null;
  return { board: { slots }, sold, sellValue: SELL_VALUE };
}

/**
 * Sell a hireling from the hand. Spells cannot be sold — attempting to
 * sell a spell instance throws.
 */
export function sellHirelingFromHand(
  hand: Hand,
  handIndex: number
): { hand: Hand; sold: HirelingInstance; sellValue: number } {
  const card = hand.cards[handIndex];
  if (!card) {
    throw new Error(`No card at hand index ${handIndex}.`);
  }
  if (!isHireling(card)) {
    throw new Error("Spells cannot be sold.");
  }
  const { hand: nextHand } = removeFromHand(hand, handIndex);
  return { hand: nextHand, sold: card, sellValue: SELL_VALUE };
}

/**
 * Move a hireling from one slot to another. Every slot between the two
 * positions shifts to accommodate (splice-insert semantics), so a drag
 * from slot 0 to slot 4 pushes slots 1..4 one position left.
 *
 * Throws if either index is out of range, if `fromSlot` is empty, or if
 * `fromSlot === toSlot` (no-op — caller should short-circuit).
 */
export function rearrangeBoard(
  board: Board,
  fromSlot: number,
  toSlot: number
): Board {
  assertSlotInRange(fromSlot);
  assertSlotInRange(toSlot);
  if (fromSlot === toSlot) return board;
  const moving = board.slots[fromSlot];
  if (!moving) {
    throw new Error(`Cannot rearrange: slot ${fromSlot} is empty.`);
  }
  const slots = board.slots.slice();
  slots.splice(fromSlot, 1);
  slots.splice(toSlot, 0, moving);
  return { slots };
}

// Re-export addToHand so callers don't have to import from two places.
export { addToHand };
