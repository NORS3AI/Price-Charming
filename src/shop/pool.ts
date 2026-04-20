import { ALL_HIRELINGS } from "../cards/hirelings";
import { ALL_SPELLS } from "../cards/spells";
import { Card, HirelingCard, SpellCard } from "../cards/types";
import { PotionTypeId } from "../potions/types";

/**
 * A single copy of a card in the shop pool. Each copy has a distinct
 * instance id (e.g. `doughboy#2`) so Spring Cleaning and individual
 * purchases can act on a specific copy. `potionType` is null for spells
 * and for hirelings that haven't been assigned yet.
 */
export interface PoolInstance {
  id: string;
  card: Card;
  potionType: PotionTypeId | null;
}

/** The master card pool — list of every copy currently available. */
export interface ShopPool {
  instances: readonly PoolInstance[];
}

/** Card id that is never in the pool — the starter Dusty Broom. */
const EXCLUDED_HIRELING_IDS = new Set(["dusty-broom"]);

/**
 * Build the initial pool from the card data. Dusty Broom is excluded
 * (pre-placed as starter, never in the pool). Charm spells are excluded
 * (poolCount === null — delivered only by Charmed hirelings). Every
 * other hireling contributes `poolCount` copies; every other spell
 * contributes `poolCount` copies.
 */
export function createInitialPool(): ShopPool {
  const instances: PoolInstance[] = [];

  for (const card of ALL_HIRELINGS) {
    if (EXCLUDED_HIRELING_IDS.has(card.id)) continue;
    for (let i = 0; i < card.poolCount; i++) {
      instances.push({
        id: instanceIdFor(card, i),
        card,
        potionType: null,
      });
    }
  }

  for (const card of ALL_SPELLS) {
    if (card.poolCount === null) continue;
    for (let i = 0; i < card.poolCount; i++) {
      instances.push({
        id: instanceIdFor(card, i),
        card,
        potionType: null,
      });
    }
  }

  return { instances };
}

/** Canonical instance id: `<card-id>#<copy-number>`. */
export function instanceIdFor(card: Card, copyIndex: number): string {
  return `${card.id}#${copyIndex}`;
}

/** Total number of copies currently in the pool. */
export function poolSize(pool: ShopPool): number {
  return pool.instances.length;
}

/** True when the pool contains the instance with the given id. */
export function isInPool(pool: ShopPool, instanceId: string): boolean {
  return pool.instances.some((i) => i.id === instanceId);
}

/** Count of remaining copies for a specific card id. */
export function countOfCard(pool: ShopPool, cardId: string): number {
  return pool.instances.reduce(
    (n, i) => (i.card.id === cardId ? n + 1 : n),
    0
  );
}

/** Narrowing filter: hireling instances only. */
export function poolHirelings(pool: ShopPool): PoolInstance[] {
  return pool.instances.filter((i) => i.card.kind === "hireling");
}

/** Narrowing filter: spell instances only. */
export function poolSpells(pool: ShopPool): PoolInstance[] {
  return pool.instances.filter((i) => i.card.kind === "spell");
}

/**
 * Instances that can appear at the given shop round — respects each
 * card's roundAvailable. Spells with `roundAvailable === null` are
 * general spells with no round gate (e.g. Potion Polish) and are
 * available from any round; spells with a concrete round (e.g. Spring
 * Cleaning, round 6) only appear once the round is reached.
 */
export function poolAvailableAtRound(
  pool: ShopPool,
  round: number
): PoolInstance[] {
  return pool.instances.filter((i) => {
    if (i.card.kind === "hireling") {
      return i.card.roundAvailable <= round;
    }
    if (i.card.roundAvailable === null) return true;
    return i.card.roundAvailable <= round;
  });
}

/**
 * Remove a single instance from the pool by id. Throws if the id isn't
 * present. Used by shop purchases and by taking a card into the shop
 * offering.
 */
export function takeFromPool(
  pool: ShopPool,
  instanceId: string
): { pool: ShopPool; taken: PoolInstance } {
  const idx = pool.instances.findIndex((i) => i.id === instanceId);
  if (idx === -1) {
    throw new Error(`Instance "${instanceId}" is not in the pool.`);
  }
  const taken = pool.instances[idx];
  const instances = pool.instances.slice();
  instances.splice(idx, 1);
  return { pool: { instances }, taken };
}

/**
 * Add an instance back to the pool. Used when a refresh returns the
 * offering or when a hireling is sold. Throws if the instance id is
 * already present.
 */
export function returnToPool(
  pool: ShopPool,
  instance: PoolInstance
): ShopPool {
  if (isInPool(pool, instance.id)) {
    throw new Error(
      `Instance "${instance.id}" is already in the pool.`
    );
  }
  return { instances: [...pool.instances, instance] };
}

/**
 * Remove every instance that matches the predicate. Returns the new pool
 * and the list of removed instances. Used by Spring Cleaning to drop an
 * entire tier of hirelings from the pool permanently.
 */
export function removeFromPoolWhere(
  pool: ShopPool,
  predicate: (inst: PoolInstance) => boolean
): { pool: ShopPool; removed: PoolInstance[] } {
  const kept: PoolInstance[] = [];
  const removed: PoolInstance[] = [];
  for (const inst of pool.instances) {
    (predicate(inst) ? removed : kept).push(inst);
  }
  return { pool: { instances: kept }, removed };
}

/** Type guard — true when the pool instance wraps a hireling card. */
export function isHirelingPoolInstance(
  inst: PoolInstance
): inst is PoolInstance & { card: HirelingCard } {
  return inst.card.kind === "hireling";
}

/** Type guard — true when the pool instance wraps a spell card. */
export function isSpellPoolInstance(
  inst: PoolInstance
): inst is PoolInstance & { card: SpellCard } {
  return inst.card.kind === "spell";
}
