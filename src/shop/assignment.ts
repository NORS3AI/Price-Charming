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
  const instances: PoolInstance[] = pool.instances.map((inst) => {
    if (inst.card.kind !== "hireling") return inst;
    const slot1 = pick(activeTypes, rng);
    // Cards with two potion slots get a second type. Pick distinct
    // types when possible (≥2 active types are always present in
    // current builds — ACTIVE_POTION_COUNT=5).
    let slot2: PotionTypeId | null = null;
    if (inst.card.potions.length >= 2 && activeTypes.length >= 2) {
      const remaining = activeTypes.filter((t) => t !== slot1);
      slot2 = pick(remaining, rng);
    }
    return { ...inst, potionType: slot1, potionType2: slot2 };
  });
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
