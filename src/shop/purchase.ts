import { addToHand, createHirelingInstance, createSpellInstance, isHandFull } from "../board/hand";
import { Board, Hand, HirelingInstance } from "../board/types";
import { sellHirelingFromBoard, sellHirelingFromHand } from "../board/board";
import { canAfford, COST_HIRELING, COST_REFRESH, COST_SPELL } from "../economy/gold";
import {
  PoolInstance,
  ShopPool,
  returnToPool,
} from "./pool";
import {
  RollOptions,
  ShopOffering,
  refreshShop,
  takeFromOffering,
} from "./offering";
import { RNG } from "../potions/rng";

/** Dusty Broom is the only hireling that disappears on sell. */
function isStarterBroom(instance: HirelingInstance): boolean {
  return instance.card.id === "dusty-broom";
}

/** Convert a sold HirelingInstance back to a PoolInstance shape. */
function toPoolInstance(instance: HirelingInstance): PoolInstance {
  return {
    id: instance.id,
    card: instance.card,
    potionType: instance.potionType,
  };
}

/**
 * Buy the hireling in `shopSlot` of the offering. Deducts COST_HIRELING
 * from gold, removes the card from the offering, and places a fresh
 * HirelingInstance (with the pool's pre-assigned potion type) into the
 * hand. Throws when the slot isn't a hireling, gold is insufficient, or
 * the hand is full.
 */
export function buyHirelingFromShop(
  offering: ShopOffering,
  shopSlot: number,
  hand: Hand,
  gold: number
): { offering: ShopOffering; hand: Hand; gold: number } {
  if (!canAfford(gold, COST_HIRELING)) {
    throw new Error(`Not enough gold to buy a hireling (need ${COST_HIRELING}).`);
  }
  if (isHandFull(hand)) {
    throw new Error("Cannot buy: hand is full.");
  }
  const peek = offering.slots[shopSlot];
  if (!peek || peek.card.kind !== "hireling") {
    throw new Error(`Shop slot ${shopSlot} is not a hireling.`);
  }

  const { offering: nextOffering, taken } = takeFromOffering(offering, shopSlot);
  const hirelingInstance = createHirelingInstance(
    // Narrowed by the peek above.
    taken.card as Parameters<typeof createHirelingInstance>[0],
    taken.id,
    taken.potionType
  );
  return {
    offering: nextOffering,
    hand: addToHand(hand, hirelingInstance),
    gold: gold - COST_HIRELING,
  };
}

/**
 * Buy the spell in `shopSlot` of the offering. Deducts COST_SPELL from
 * gold, removes the card from the offering, and places a SpellInstance
 * into the hand. Throws when the slot isn't a spell, gold is insufficient,
 * or the hand is full.
 */
export function buySpellFromShop(
  offering: ShopOffering,
  shopSlot: number,
  hand: Hand,
  gold: number
): { offering: ShopOffering; hand: Hand; gold: number } {
  if (!canAfford(gold, COST_SPELL)) {
    throw new Error(`Not enough gold to buy a spell (need ${COST_SPELL}).`);
  }
  if (isHandFull(hand)) {
    throw new Error("Cannot buy: hand is full.");
  }
  const peek = offering.slots[shopSlot];
  if (!peek || peek.card.kind !== "spell") {
    throw new Error(`Shop slot ${shopSlot} is not a spell.`);
  }

  const { offering: nextOffering, taken } = takeFromOffering(offering, shopSlot);
  const spellInstance = createSpellInstance(
    taken.card as Parameters<typeof createSpellInstance>[0],
    taken.id
  );
  return {
    offering: nextOffering,
    hand: addToHand(hand, spellInstance),
    gold: gold - COST_SPELL,
  };
}

/**
 * Refresh the shop — return the existing offering to the pool, roll a
 * fresh one, and charge the player 1g. Throws when gold is insufficient.
 */
export function refreshShopWithCost(
  offering: ShopOffering,
  pool: ShopPool,
  round: number,
  rng: RNG,
  gold: number,
  opts?: RollOptions
): { offering: ShopOffering; pool: ShopPool; gold: number } {
  if (!canAfford(gold, COST_REFRESH)) {
    throw new Error(`Not enough gold to refresh (need ${COST_REFRESH}).`);
  }
  const res = refreshShop(offering, pool, round, rng, opts);
  return { ...res, gold: gold - COST_REFRESH };
}

/**
 * Sell a hireling from the hand. Adds the sell value to gold, returns
 * the hireling's copy to the pool (Dusty Broom is the exception — it
 * disappears permanently), and removes it from the hand. Throws when
 * the hand card is a spell.
 */
export function sellHirelingFromHandToPool(
  hand: Hand,
  handIndex: number,
  pool: ShopPool,
  gold: number
): { hand: Hand; pool: ShopPool; gold: number } {
  const res = sellHirelingFromHand(hand, handIndex);
  const nextPool = isStarterBroom(res.sold)
    ? pool
    : returnToPool(pool, toPoolInstance(res.sold));
  return { hand: res.hand, pool: nextPool, gold: gold + res.sellValue };
}

/**
 * Sell a hireling from the board. Adds the sell value to gold, returns
 * the copy to the pool (skipped for Dusty Broom), and empties the slot.
 */
export function sellHirelingFromBoardToPool(
  board: Board,
  slot: number,
  pool: ShopPool,
  gold: number
): { board: Board; pool: ShopPool; gold: number } {
  const res = sellHirelingFromBoard(board, slot);
  const nextPool = isStarterBroom(res.sold)
    ? pool
    : returnToPool(pool, toPoolInstance(res.sold));
  return { board: res.board, pool: nextPool, gold: gold + res.sellValue };
}
