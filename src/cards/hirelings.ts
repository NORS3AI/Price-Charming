import { loadCards } from "./loader";
import { HirelingCard } from "./types";

const cards = loadCards();

/** Every hireling defined in `src/data/cards.csv`. */
export const ALL_HIRELINGS: readonly HirelingCard[] = cards.filter(
  (c): c is HirelingCard => c.kind === "hireling"
);
