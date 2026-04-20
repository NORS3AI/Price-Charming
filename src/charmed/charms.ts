import { ALL_SPELLS } from "../cards/spells";
import { SpellCard } from "../cards/types";
import { Board, Hand, HirelingInstance } from "../board/types";
import {
  addToHand,
  createSpellInstance,
  isHireling,
  isSpell,
  removeFromHand,
} from "../board/hand";
import { playHirelingFromHand } from "../board/board";
import { COST_REFRESH } from "../economy/gold";
import { pick, RNG } from "../potions/rng";
import {
  RollOptions,
  ShopOffering,
  refreshShop,
} from "../shop/offering";
import { ShopPool } from "../shop/pool";

/** Card ids of the three Charm spells, in canonical order. */
export const CHARM_SPELL_IDS = [
  "tip-jar-charm",
  "second-chance-charm",
  "lucky-charm",
] as const;

/** All Charm spell cards, looked up from the loader. */
export const CHARM_SPELL_CARDS: readonly SpellCard[] = (() => {
  const cards: SpellCard[] = [];
  for (const id of CHARM_SPELL_IDS) {
    const card = ALL_SPELLS.find((s) => s.id === id);
    if (!card) {
      throw new Error(
        `Missing Charm spell "${id}" in ALL_SPELLS — cards.csv out of sync.`
      );
    }
    cards.push(card);
  }
  return Object.freeze(cards);
})();

/** Draw a uniformly random Charm spell card. */
export function pickRandomCharm(rng: RNG): SpellCard {
  return pick(CHARM_SPELL_CARDS, rng);
}

/** Numeric constants from the spec for each Charm. */
export const TIP_JAR_GOLD = 3;
export const LUCKY_POTENCY_BONUS = 3;

/**
 * Play a hireling from the hand onto the board. If the played card is
 * a Charmed instance, a random Charm spell is granted to the hand
 * (returned via `grantedCharm`). The grant is null otherwise.
 *
 * Throws if the hand is full when the Charm is granted (the play
 * itself frees one slot, so this only matters in pathological cases).
 */
export function playCharmed(
  board: Board,
  hand: Hand,
  handIndex: number,
  slot: number,
  rng: RNG,
  charmIdFor: (cardId: string) => string = (id) => `charm-${id}-${Date.now()}`
): { board: Board; hand: Hand; grantedCharm: SpellCard | null } {
  const card = hand.cards[handIndex];
  if (!card || !isHireling(card)) {
    throw new Error(`Hand index ${handIndex} is not a hireling.`);
  }
  const wasCharmed = card.charmed;
  const played = playHirelingFromHand(board, hand, handIndex, slot);

  if (!wasCharmed) {
    return { board: played.board, hand: played.hand, grantedCharm: null };
  }
  const charmCard = pickRandomCharm(rng);
  const handAfterGrant = addToHand(
    played.hand,
    createSpellInstance(charmCard, charmIdFor(charmCard.id))
  );
  return {
    board: played.board,
    hand: handAfterGrant,
    grantedCharm: charmCard,
  };
}

/** Helper: pluck a Charm spell at handIndex; throws if it's not the right id. */
function takeCharmFromHand(
  hand: Hand,
  handIndex: number,
  expectedId: string
): { hand: Hand } {
  const card = hand.cards[handIndex];
  if (!card || !isSpell(card)) {
    throw new Error(`Hand index ${handIndex} is not a spell.`);
  }
  if (card.card.id !== expectedId) {
    throw new Error(
      `Hand index ${handIndex} is "${card.card.id}", not "${expectedId}".`
    );
  }
  const { hand: nextHand } = removeFromHand(hand, handIndex);
  return { hand: nextHand };
}

/** Tip Jar Charm: +TIP_JAR_GOLD gold. Consumes the spell. */
export function castTipJarCharm(
  hand: Hand,
  handIndex: number,
  gold: number
): { hand: Hand; gold: number } {
  const { hand: nextHand } = takeCharmFromHand(
    hand,
    handIndex,
    "tip-jar-charm"
  );
  return { hand: nextHand, gold: gold + TIP_JAR_GOLD };
}

/**
 * Second Chance Charm: free shop refresh. Consumes the spell, returns
 * the prior offering to the pool, and rolls a fresh one — gold is
 * unchanged because the refresh is free.
 */
export function castSecondChanceCharm(
  hand: Hand,
  handIndex: number,
  offering: ShopOffering,
  pool: ShopPool,
  round: number,
  rng: RNG,
  opts?: RollOptions
): { hand: Hand; offering: ShopOffering; pool: ShopPool } {
  const { hand: nextHand } = takeCharmFromHand(
    hand,
    handIndex,
    "second-chance-charm"
  );
  const refreshed = refreshShop(offering, pool, round, rng, opts);
  return { hand: nextHand, ...refreshed };
}

/**
 * Lucky Charm: grant +LUCKY_POTENCY_BONUS permanent potency to a
 * friendly hireling on the board. Consumes the spell and returns the
 * updated board and hand.
 */
export function castLuckyCharm(
  hand: Hand,
  handIndex: number,
  board: Board,
  targetSlot: number
): { hand: Hand; board: Board; target: HirelingInstance } {
  const target = board.slots[targetSlot];
  if (!target) {
    throw new Error(`Target slot ${targetSlot} is empty.`);
  }
  const { hand: nextHand } = takeCharmFromHand(hand, handIndex, "lucky-charm");
  const buffed: HirelingInstance = {
    ...target,
    permanentPotencyBonus: target.permanentPotencyBonus + LUCKY_POTENCY_BONUS,
  };
  const slots = board.slots.slice();
  slots[targetSlot] = buffed;
  return { hand: nextHand, board: { slots }, target: buffed };
}

/** Reference to refresh cost so callers can confirm "free" semantics. */
export { COST_REFRESH };
