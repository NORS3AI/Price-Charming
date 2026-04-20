import { HirelingInstance } from "../board/types";
import { pick, RNG } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { PoolInstance, ShopPool } from "./pool";

/**
 * Assign each hireling copy in the pool a random active potion type.
 * Called at the start of every shop phase — refreshing the shop does
 * NOT reshuffle (that's handled at the shop-offering layer).
 *
 * Spell instances are left alone (potionType stays null). Returns a
 * fresh pool; the input is not mutated.
 */
export function assignPotionsToPool(
  pool: ShopPool,
  activeTypes: readonly PotionTypeId[],
  rng: RNG
): ShopPool {
  if (activeTypes.length === 0) {
    throw new Error("assignPotionsToPool requires at least one active type.");
  }
  const instances: PoolInstance[] = pool.instances.map((inst) =>
    inst.card.kind === "hireling"
      ? { ...inst, potionType: pick(activeTypes, rng) }
      : inst
  );
  return { instances };
}

/**
 * Assign a potion type to a single hireling instance. Used for the
 * Dusty Broom starter, which receives a random active potion at game
 * start (it lives on the board, not in the pool).
 */
export function assignHirelingPotion(
  instance: HirelingInstance,
  activeTypes: readonly PotionTypeId[],
  rng: RNG
): HirelingInstance {
  if (activeTypes.length === 0) {
    throw new Error("assignHirelingPotion requires at least one active type.");
  }
  return { ...instance, potionType: pick(activeTypes, rng) };
}
