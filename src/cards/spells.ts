import { getAllCards } from "./loader";
import { SpellCard } from "./types";

/** Every spell defined in `src/data/cards.csv`. */
export const ALL_SPELLS: readonly SpellCard[] = getAllCards().filter(
  (c): c is SpellCard => c.kind === "spell"
);
