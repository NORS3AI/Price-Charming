import { ALL_SPELLS } from "../cards/spells";
import { removeFromHand } from "../board/hand";
import { Hand } from "../board/types";
import { WageTier } from "../cards/types";
import {
  PoolInstance,
  ShopPool,
  removeFromPoolWhere,
  returnToPool,
} from "./pool";

/** Card id of the base Spring Cleaning spell (round 6, Tier 1 removal). */
export const SPRING_CLEANING_ID = "spring-cleaning";

/** Card id of the upgraded form returned after casting the base. */
export const SPRING_CLEANING_UPGRADED_ID = "spring-cleaning-upgraded";

const UPGRADED_CARD = ALL_SPELLS.find(
  (s) => s.id === SPRING_CLEANING_UPGRADED_ID
);
if (!UPGRADED_CARD) {
  throw new Error(
    `Missing "${SPRING_CLEANING_UPGRADED_ID}" in ALL_SPELLS; cards.csv out of sync.`
  );
}

/** True for either Spring Cleaning spell id. */
export function isSpringCleaningId(id: string): boolean {
  return id === SPRING_CLEANING_ID || id === SPRING_CLEANING_UPGRADED_ID;
}

/**
 * Cast the Spring Cleaning spell at `handIndex`:
 *  - Base Spring Cleaning removes every Low-wage (Tier 1) hireling from
 *    the pool permanently and returns an upgraded copy to the pool.
 *  - Spring Cleaning (Upgraded) removes every Medium-wage (Tier 2)
 *    hireling from the pool permanently.
 *
 * Returns the hand with the spell removed, the updated pool, the list of
 * removed hireling instances (for UI flavour), and — only for the base
 * cast — the upgraded copy now in the pool. Throws if the hand slot is
 * not a Spring Cleaning spell.
 */
export function castSpringCleaning(
  hand: Hand,
  handIndex: number,
  pool: ShopPool
): {
  hand: Hand;
  pool: ShopPool;
  removedHirelings: PoolInstance[];
  upgradedPoolInstance: PoolInstance | null;
} {
  const card = hand.cards[handIndex];
  if (!card || card.card.kind !== "spell") {
    throw new Error(`Hand index ${handIndex} is not a spell.`);
  }
  if (!isSpringCleaningId(card.card.id)) {
    throw new Error(
      `Hand index ${handIndex} is not a Spring Cleaning spell (got "${card.card.id}").`
    );
  }

  const { hand: nextHand } = removeFromHand(hand, handIndex);

  const isBase = card.card.id === SPRING_CLEANING_ID;
  const tierToRemove: WageTier = isBase ? "Low" : "Medium";

  const res = removeFromPoolWhere(
    pool,
    (inst) =>
      inst.card.kind === "hireling" && inst.card.wageTier === tierToRemove
  );

  let nextPool = res.pool;
  let upgradedPoolInstance: PoolInstance | null = null;

  if (isBase) {
    // Derive a deterministic, unique id from the cast instance so
    // repeat casts never collide in the pool.
    upgradedPoolInstance = {
      id: `${SPRING_CLEANING_UPGRADED_ID}#from-${card.id}`,
      card: UPGRADED_CARD!,
      potionType: null,
    };
    nextPool = returnToPool(nextPool, upgradedPoolInstance);
  }

  return {
    hand: nextHand,
    pool: nextPool,
    removedHirelings: res.removed,
    upgradedPoolInstance,
  };
}
