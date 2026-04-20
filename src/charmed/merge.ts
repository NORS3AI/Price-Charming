import { sellHirelingFromBoard } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { Board, Hand, HirelingInstance } from "../board/types";
import {
  MAX_HAND_SIZE,
  addToHand,
  isHireling,
  removeFromHand,
} from "../board/hand";
import { ShopPool, removeFromPoolWhere } from "../shop/pool";

/** Number of identical copies needed to trigger a Charmed merge. */
export const CHARM_MERGE_COUNT = 3;

/**
 * A detected merge candidate: 3 instances of the same card.id sharing
 * the same potionType, located across hand and board (instance id +
 * source so callers can remove from the right collection).
 */
export interface CharmableTriple {
  cardId: string;
  potionType: string;
  /**
   * Length-3 list of instances. Each entry tells the caller where the
   * instance lives so it can be plucked out cleanly.
   */
  members: ReadonlyArray<{
    instance: HirelingInstance;
    /** Either a board slot index or a hand index. */
    source: { kind: "board"; slot: number } | { kind: "hand"; index: number };
  }>;
}

interface Located {
  instance: HirelingInstance;
  source: CharmableTriple["members"][number]["source"];
}

/**
 * Walk the player's hand and board to find any 3 instances of the same
 * card.id with the same non-null potionType. Returns the first such
 * triple in canonical order, or null. Charmed instances themselves are
 * never re-merged.
 */
export function findCharmableTriple(
  board: Board,
  hand: Hand
): CharmableTriple | null {
  const buckets = new Map<string, Located[]>();

  const collect = (loc: Located) => {
    if (loc.instance.charmed) return;
    if (loc.instance.potionType === null) return;
    const key = `${loc.instance.card.id}|${loc.instance.potionType}`;
    let list = buckets.get(key);
    if (!list) {
      list = [];
      buckets.set(key, list);
    }
    list.push(loc);
  };

  for (let i = 0; i < board.slots.length; i++) {
    const inst = board.slots[i];
    if (inst) collect({ instance: inst, source: { kind: "board", slot: i } });
  }
  for (let i = 0; i < hand.cards.length; i++) {
    const card = hand.cards[i];
    if (isHireling(card)) {
      collect({ instance: card, source: { kind: "hand", index: i } });
    }
  }

  for (const [key, list] of buckets) {
    if (list.length >= CHARM_MERGE_COUNT) {
      const [a, b, c] = list.slice(0, CHARM_MERGE_COUNT);
      return {
        cardId: a.instance.card.id,
        potionType: a.instance.potionType!,
        members: [a, b, c],
      };
    }
  }
  return null;
}

/**
 * Build the Charmed instance from three identical copies. Stats are the
 * SUM of the consumed copies' effective stats (base + permanent bonus).
 * Cast time, keywords, and potion type all come from the shared base
 * card. The Charmed gets a fresh wage tracker — it's a new entity and
 * starts at payday 1.
 */
export function buildCharmedInstance(
  members: CharmableTriple["members"],
  id: string
): HirelingInstance {
  const [a, b, c] = members.map((m) => m.instance);
  const baseStock = a.card.potions[0]?.stock ?? 0;
  const basePotency = a.card.potions[0]?.potency ?? 0;
  const sumStock =
    baseStock * 3 +
    a.permanentStockBonus +
    b.permanentStockBonus +
    c.permanentStockBonus;
  const sumPotency =
    basePotency * 3 +
    a.permanentPotencyBonus +
    b.permanentPotencyBonus +
    c.permanentPotencyBonus;

  return createHirelingInstance(a.card, id, a.potionType, {
    permanentStockBonus: sumStock - baseStock,
    permanentPotencyBonus: sumPotency - basePotency,
    charmed: true,
  });
}

/**
 * Apply a Charmed merge: remove the three consumed copies from the
 * board / hand, drop their pool counterparts, and place the new Charmed
 * instance directly into the hand.
 *
 * Throws if the merge would overflow the hand — e.g. when all 3 copies
 * are on the board and the hand is already full. The caller should
 * free a hand slot (or sell something) and retry.
 */
export function mergeCharmableTriple(
  triple: CharmableTriple,
  state: { board: Board; hand: Hand; pool: ShopPool },
  charmedId: string
): { board: Board; hand: Hand; pool: ShopPool; charmed: HirelingInstance } {
  // Sort sources so we remove higher indices first within each
  // collection — that way earlier indices stay valid as we splice.
  const handSources = triple.members
    .filter((m) => m.source.kind === "hand")
    .map((m) => m.source as { kind: "hand"; index: number })
    .sort((x, y) => y.index - x.index);
  const boardSources = triple.members
    .filter((m) => m.source.kind === "board")
    .map((m) => m.source as { kind: "board"; slot: number })
    .sort((x, y) => y.slot - x.slot);

  // Pre-check hand overflow so we never half-mutate the state: after
  // removing hand sources and adding the Charmed, the hand must fit.
  const projectedHandSize =
    state.hand.cards.length - handSources.length + 1;
  if (projectedHandSize > MAX_HAND_SIZE) {
    throw new Error(
      `Charmed merge would overflow the hand (projected ${projectedHandSize} > max ${MAX_HAND_SIZE}). Free a hand slot and retry.`
    );
  }

  let hand = state.hand;
  for (const src of handSources) {
    hand = removeFromHand(hand, src.index).hand;
  }
  let board = state.board;
  for (const src of boardSources) {
    board = sellHirelingFromBoard(board, src.slot).board;
  }

  // Pool: drop every copy of this card.id (consumed copies are
  // permanently removed, plus any other copies still floating around).
  const consumedInstanceIds = new Set(
    triple.members.map((m) => m.instance.id)
  );
  const { pool } = removeFromPoolWhere(state.pool, (inst) =>
    consumedInstanceIds.has(inst.id)
  );

  const charmed = buildCharmedInstance(triple.members, charmedId);
  hand = addToHand(hand, charmed);

  return { board, hand, pool, charmed };
}

let defaultCharmedIdCounter = 0;

/** Convenience wrapper: detect a triple and merge it in one call. */
export function mergeIfCharmable(
  state: { board: Board; hand: Hand; pool: ShopPool },
  charmedIdFor: (cardId: string) => string = (id) =>
    `charmed-${id}-${Date.now()}-${defaultCharmedIdCounter++}`
): { board: Board; hand: Hand; pool: ShopPool; charmed: HirelingInstance | null } {
  const triple = findCharmableTriple(state.board, state.hand);
  if (!triple) return { ...state, charmed: null };
  return mergeCharmableTriple(triple, state, charmedIdFor(triple.cardId));
}

