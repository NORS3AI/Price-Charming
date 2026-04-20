/** A guild a card belongs to. "Spell" tags non-hireling spell cards. */
export type Guild =
  | "Sugar Guild"
  | "Thieves Guild"
  | "Nobles Guild"
  | "No Guild"
  | "Spell";

/** Guilds restricted to hireling cards (excludes "Spell"). */
export type HirelingGuild = Exclude<Guild, "Spell">;

/** Flat wage tiers from the design spec. "None" is the starter exemption. */
export type WageTier = "Low" | "Medium" | "High" | "None";

/** Star rating: blank, ⭐, or ⭐⭐. */
export type StarRating = 0 | 1 | 2;

/**
 * Keyword names. Hireling-facing keywords are the first five; "Charm"
 * tags one-time-use spells granted by Charmed hirelings.
 */
export type KeywordName =
  | "Sabotage"
  | "Bewitch"
  | "Knockoff"
  | "Haggle"
  | "Quickcraft"
  | "Charm";

/** Keywords that accept an `xN` count on a card. */
export type CountedKeywordName = "Knockoff" | "Haggle" | "Quickcraft";

/** A single keyword instance on a card, optionally with an `xN` count. */
export interface Keyword {
  name: KeywordName;
  count?: number;
}

/**
 * Cast-time variations encountered in cards.csv:
 *   - "5s" → seconds
 *   - "Passive" → passive
 *   - "1-8s (random)" → random
 *   - "7s (reduces by 1s per cast)" → decreasing
 */
export type CastTime =
  | { kind: "seconds"; value: number }
  | { kind: "passive" }
  | { kind: "random"; min: number; max: number }
  | { kind: "decreasing"; start: number; decrementPerCast: number };

/** A potion slot carried by a hireling. */
export interface PotionSlot {
  /** Base stock. Hirelings with Quickcraft have a printed stock of 0. */
  stock: number;
  potency: number;
}

/** Shared fields across all cards. */
export interface BaseCard {
  /** Kebab-case identifier derived from the name. */
  id: string;
  name: string;
  starRating: StarRating;
  keywords: Keyword[];
  abilityText: string;
}

/** A hireling — staffs the shop, carries 1 or 2 potions. */
export interface HirelingCard extends BaseCard {
  kind: "hireling";
  guild: HirelingGuild;
  wageTier: WageTier;
  /** Earliest shop round at which this hireling can appear in the pool. */
  roundAvailable: number;
  /** Number of copies of this hireling in the shared pool. */
  poolCount: number;
  potions: PotionSlot[];
  castTime: CastTime;
}

/** A spell card — bought into the hand, used during the shop phase. */
export interface SpellCard extends BaseCard {
  kind: "spell";
  /** Earliest shop round at which the spell can appear, or null if not in the pool (e.g. Charm). */
  roundAvailable: number | null;
  /** Pool count, or null if the spell is not in the pool (e.g. Charm). */
  poolCount: number | null;
}

/** Any card (hireling or spell). */
export type Card = HirelingCard | SpellCard;
