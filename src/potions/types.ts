/** Canonical identifiers for potion types. */
export type PotionTypeId =
  | "love"
  | "dragons-breath"
  | "mermaids-tears"
  | "goblins-greed"
  | "luck"
  | "half-curse-cure"
  | "flutterfix";

/** Display metadata for a potion type. */
export interface PotionTypeMeta {
  id: PotionTypeId;
  name: string;
  icon: string;
  flavor: string;
}

/** All seven potion types in canonical order. */
export const POTION_TYPES: readonly PotionTypeMeta[] = Object.freeze([
  { id: "love", name: "Love Potion", icon: "❤️", flavor: "Results may vary" },
  {
    id: "dragons-breath",
    name: "Dragon's Breath Tonic",
    icon: "🔥",
    flavor: "A little spicy, a little smelly",
  },
  {
    id: "mermaids-tears",
    name: "Mermaid's Tears Elixir",
    icon: "💧",
    flavor: "Not a product of a happy ending",
  },
  {
    id: "goblins-greed",
    name: "Goblin's Greed Brew",
    icon: "💰",
    flavor: "It's mine, mine, mine!",
  },
  { id: "luck", name: "Luck Potion", icon: "🍀", flavor: "" },
  { id: "half-curse-cure", name: "Half-Curse Cure", icon: "💀", flavor: "" },
  {
    id: "flutterfix",
    name: "Flutterfix Tonic",
    icon: "🪽",
    flavor: "Fixes wings",
  },
] as const);

/** Count of potion types active per run (out of 7). */
export const ACTIVE_POTION_COUNT = 5;

const POTION_BY_ID: ReadonlyMap<PotionTypeId, PotionTypeMeta> = new Map(
  POTION_TYPES.map((p) => [p.id, p])
);

/** Look up metadata by id. Returns undefined if the id is unknown. */
export function getPotionMeta(
  id: PotionTypeId
): PotionTypeMeta | undefined {
  return POTION_BY_ID.get(id);
}
