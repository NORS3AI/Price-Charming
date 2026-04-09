/** Tier determines when a card becomes available in the shop. */
export type Tier = 1 | 2 | 3;

/** The three kinds of cards in the game. */
export type CardKind = "hireling" | "assistant" | "spell";

/** Tribes group hirelings for synergy bonuses. */
export type Tribe =
  | "royalty"
  | "woodland"
  | "enchanted"
  | "mischief"
  | "culinary";

/** A potion slot carried by a hireling. */
export interface PotionSlot {
  name: string;
  stock: number;
  potency: number;
  price: number;
}

/** Base fields shared by every card. */
export interface BaseCard {
  id: string;
  name: string;
  kind: CardKind;
  tier: Tier;
  description: string;
}

/** A hireling carries potions, belongs to a tribe, and may be transformable. */
export interface HirelingCard extends BaseCard {
  kind: "hireling";
  tribe: Tribe;
  potions: PotionSlot[];
  castTime: number;
  transformable: boolean;
}

/** An assistant helps make and stock potions but doesn't carry them. */
export interface AssistantCard extends BaseCard {
  kind: "assistant";
}

/** A spell applies an effect when played. */
export interface SpellCard extends BaseCard {
  kind: "spell";
}

export type Card = HirelingCard | AssistantCard | SpellCard;
