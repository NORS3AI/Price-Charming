import { loadCards } from "./loader";
import { SpellCard } from "./types";

const cards = loadCards();

/** Every spell defined in `src/data/cards.csv`. */
export const ALL_SPELLS: readonly SpellCard[] = cards.filter(
  (c): c is SpellCard => c.kind === "spell"
);
