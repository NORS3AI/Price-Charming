import { getAllCards } from "./loader";
import { HirelingCard } from "./types";

/** Every hireling defined in `src/data/cards.csv`. */
export const ALL_HIRELINGS: readonly HirelingCard[] = getAllCards().filter(
  (c): c is HirelingCard => c.kind === "hireling"
);
