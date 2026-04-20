import { HirelingCard, SpellCard } from "../cards/types";
import { WageTracker } from "../economy/wages";

/**
 * A hireling instance on the board or in the hand. Wraps the underlying
 * card template with per-instance state (wage tracker; later: permanent
 * buffs, current potion assignment, charmed flag, etc.).
 */
export interface HirelingInstance {
  /** Unique instance id — distinct from `card.id` so two copies coexist. */
  id: string;
  card: HirelingCard;
  wageTracker: WageTracker;
}

/** A spell instance in the hand. Spells are consumed on use. */
export interface SpellInstance {
  id: string;
  card: SpellCard;
}

/** Either kind of card the player can hold in their hand. */
export type HandCardInstance = HirelingInstance | SpellInstance;

/** The player's hand — a flat list of up to MAX_HAND_SIZE cards. */
export interface Hand {
  cards: readonly HandCardInstance[];
}

/**
 * The 7-slot board. slots[0] and slots[6] are the bench (1-indexed
 * slots 1 and 7). slots[1..5] are active (1-indexed slots 2..6). A `null`
 * entry is an empty slot.
 */
export interface Board {
  slots: readonly (HirelingInstance | null)[];
}
