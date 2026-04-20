import { defaultRng, RNG, shuffle } from "./rng";
import { ACTIVE_POTION_COUNT, POTION_TYPES, PotionTypeId } from "./types";

/**
 * Select the 5 potion types that are active for this run. All 7 types have
 * equal probability. Deterministic when passed a seeded RNG.
 */
export function selectActivePotionTypes(
  rng: RNG = defaultRng
): readonly PotionTypeId[] {
  return shuffle(
    POTION_TYPES.map((p) => p.id),
    rng
  ).slice(0, ACTIVE_POTION_COUNT);
}
