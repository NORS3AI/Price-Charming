import { HandCardInstance, Hand, HirelingInstance, SpellInstance } from "./types";

/** Maximum hand size — both hirelings and spells share these slots. */
export const MAX_HAND_SIZE = 8;

/** Create a new, empty hand. */
export function createHand(): Hand {
  return { cards: [] };
}

/** Number of cards currently in the hand. */
export function handSize(hand: Hand): number {
  return hand.cards.length;
}

/** True when the hand has no room for another card. */
export function isHandFull(hand: Hand): boolean {
  return hand.cards.length >= MAX_HAND_SIZE;
}

/**
 * Append a card to the hand. Throws when the hand is already full — the
 * shop UI should check `isHandFull` before attempting a purchase.
 */
export function addToHand(hand: Hand, card: HandCardInstance): Hand {
  if (isHandFull(hand)) {
    throw new Error(`Hand is full (max ${MAX_HAND_SIZE}).`);
  }
  return { cards: [...hand.cards, card] };
}

/**
 * Remove the card at `index` from the hand. Returns both the new hand
 * and the removed card. Throws on out-of-bounds.
 */
export function removeFromHand(
  hand: Hand,
  index: number
): { hand: Hand; removed: HandCardInstance } {
  const removed = hand.cards[index];
  if (!removed) {
    throw new Error(`No card at hand index ${index}.`);
  }
  const cards = hand.cards.filter((_, i) => i !== index);
  return { hand: { cards }, removed };
}

/** Narrowing helper: true if the card is a hireling instance. */
export function isHireling(
  card: HandCardInstance
): card is HirelingInstance {
  return card.card.kind === "hireling";
}

/** Narrowing helper: true if the card is a spell instance. */
export function isSpell(card: HandCardInstance): card is SpellInstance {
  return card.card.kind === "spell";
}
