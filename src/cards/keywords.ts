import { CountedKeywordName, KeywordName } from "./types";

/**
 * Keyword definitions for both engine code and player-facing UI.
 *
 * - `coding` is the precise behavioural rule used by the simulator.
 * - `player` is the short tooltip-friendly text shown on hover.
 * - `acceptsCount` indicates whether the keyword can appear as `xN` on a card.
 */
export interface KeywordDefinition {
  name: KeywordName;
  acceptsCount: boolean;
  coding: string;
  player: string;
}

/** Keywords that can carry an `xN` count on a card. */
export const COUNTED_KEYWORDS: readonly CountedKeywordName[] = [
  "Knockoff",
  "Haggle",
  "Quickcraft",
] as const;

const definitions: KeywordDefinition[] = [
  {
    name: "Sabotage",
    acceptsCount: false,
    coding:
      "Increases one opponent hireling's cast time by 1s until the end of the current action round. " +
      "Some hirelings specify which opponent hireling is targeted (highest cast time, lowest cast time, random etc). " +
      "If no target is specified, the target is random.",
    player:
      "Increase an opponent hireling's cast time by 1s (until end of round).",
  },
  {
    name: "Bewitch",
    acceptsCount: false,
    coding:
      "This hireling gains customer Focus, drawing one customer's attention to your side. " +
      "After this hireling sells to a Bewitched customer, its next Bewitch affects one additional " +
      "customer simultaneously. Maximum of 2 customers Bewitched at a time.",
    player:
      "This hireling gains customer Focus. After it sells, its next Bewitch affects an additional customer. (Up to 2 customers at a time.)",
  },
  {
    name: "Knockoff",
    acceptsCount: true,
    coding:
      "After this hireling sells, if its current potency is below 10, gain +X permanent stock. " +
      "X is determined by the number following the keyword on the card.",
    player:
      "After this hireling sells, if its potency is below 10, gain +X stock (permanently).",
  },
  {
    name: "Haggle",
    acceptsCount: true,
    coding:
      "Potions sold by this hireling are automatically priced 3g above the player's set price for that potion type. " +
      "This happens passively with no player input required. Each Haggle sale costs -1 reputation. " +
      "This modifier is per hireling and does not appear in the potion pricing panel.",
    player:
      "Potions sold by this hireling can be priced up to 3g above their set price; those sales grant -1 reputation.",
  },
  {
    name: "Quickcraft",
    acceptsCount: true,
    coding:
      "This hireling's base stock is always 0. After this hireling casts its action, gain +X temporary stock. " +
      "X is determined by the number following the keyword on the card. " +
      "Temporary stock is generated during action phase only and resets to 0 at the start of each shop round.",
    player: "Base stock is 0. After this acts, gain +X temporary stock.",
  },
  {
    name: "Charm",
    acceptsCount: false,
    coding:
      "Marks a one-time-use spell granted to the player's hand when a Charmed hireling is played onto the board. " +
      "Charm cards are not part of the shop pool.",
    player: "One-time-use spell from a Charmed hireling.",
  },
];

const KEYWORDS: ReadonlyMap<KeywordName, KeywordDefinition> = new Map(
  definitions.map((d) => [d.name, d])
);

/** All keyword definitions, in the canonical display order. */
export const ALL_KEYWORDS: readonly KeywordDefinition[] = definitions;

/** Look up a keyword's definition by name. */
export function getKeywordDefinition(
  name: KeywordName
): KeywordDefinition | undefined {
  return KEYWORDS.get(name);
}

/** Returns true if the given keyword name supports an `xN` count. */
export function keywordAcceptsCount(name: KeywordName): boolean {
  return KEYWORDS.get(name)?.acceptsCount ?? false;
}
