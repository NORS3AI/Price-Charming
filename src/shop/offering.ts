import { pick, RNG, shuffle } from "../potions/rng";
import {
  PoolInstance,
  ShopPool,
  isHirelingPoolInstance,
  isSpellPoolInstance,
  poolAvailableAtRound,
  returnToPool,
  takeFromPool,
} from "./pool";

/** Number of slots the shop rolls by default. */
export const DEFAULT_SHOP_SIZE = 5;

/**
 * Probability that a shop roll includes a spell slot, subject to the
 * "at most 1 spell per refresh" rule. When no spells are eligible this
 * round, no spell slot is included and every slot is a hireling.
 */
export const DEFAULT_SPELL_CHANCE = 0.25;

/** The current shop offering — fixed number of slots. */
export interface ShopOffering {
  /** Each slot holds an instance, or null if the pool couldn't fill it. */
  slots: readonly (PoolInstance | null)[];
}

/** Options shared by rollShop and refreshShop. */
export interface RollOptions {
  /** Number of slots in the shop. Defaults to DEFAULT_SHOP_SIZE. */
  size?: number;
  /** Probability a roll includes one spell slot. Defaults to DEFAULT_SPELL_CHANCE. */
  spellChance?: number;
}

/** Start-of-game placeholder — no cards yet rolled. */
export function createEmptyOffering(size = DEFAULT_SHOP_SIZE): ShopOffering {
  return { slots: Array<null>(size).fill(null) };
}

/** Non-null instances currently on offer. */
export function offeringInstances(offering: ShopOffering): PoolInstance[] {
  return offering.slots.filter((s): s is PoolInstance => s !== null);
}

/** Hireling instances currently on offer. */
export function offeringHirelings(offering: ShopOffering): PoolInstance[] {
  return offeringInstances(offering).filter(isHirelingPoolInstance);
}

/** Spell instances currently on offer. */
export function offeringSpells(offering: ShopOffering): PoolInstance[] {
  return offeringInstances(offering).filter(isSpellPoolInstance);
}

/**
 * Roll a fresh shop offering out of the pool. Draws uniformly without
 * replacement from the round-eligible pool. At most one spell slot is
 * included (controlled by `spellChance`); remaining slots are hirelings.
 *
 * Returns the offering and the pool with drawn instances removed.
 */
export function rollShop(
  pool: ShopPool,
  round: number,
  rng: RNG,
  opts: RollOptions = {}
): { offering: ShopOffering; pool: ShopPool } {
  const size = opts.size ?? DEFAULT_SHOP_SIZE;
  const spellChance = opts.spellChance ?? DEFAULT_SPELL_CHANCE;

  const eligible = poolAvailableAtRound(pool, round);
  const hirelings = eligible.filter(isHirelingPoolInstance);
  const spells = eligible.filter(isSpellPoolInstance);

  const includeSpell = spells.length > 0 && rng() < spellChance;
  const hirelingTarget = includeSpell ? size - 1 : size;

  const picked: PoolInstance[] = [];
  if (includeSpell) picked.push(pick(spells, rng));
  picked.push(...shuffle(hirelings, rng).slice(0, hirelingTarget));

  // Shuffle picks across slot positions so the spell doesn't always land
  // in slot 0 (which would leak "no spell this refresh" to the player).
  const arranged = shuffle(picked, rng);

  let nextPool = pool;
  for (const inst of arranged) {
    nextPool = takeFromPool(nextPool, inst.id).pool;
  }

  const slots: (PoolInstance | null)[] = Array<PoolInstance | null>(size).fill(
    null
  );
  for (let i = 0; i < arranged.length; i++) slots[i] = arranged[i];

  return { offering: { slots }, pool: nextPool };
}

/**
 * Refresh the shop: return every currently offered instance to the pool
 * and roll a fresh offering. Respects the "at most 1 spell" rule per
 * refresh. The caller applies the 1g refresh cost to the player's gold.
 */
export function refreshShop(
  offering: ShopOffering,
  pool: ShopPool,
  round: number,
  rng: RNG,
  opts: RollOptions = {}
): { offering: ShopOffering; pool: ShopPool } {
  let nextPool = pool;
  for (const inst of offeringInstances(offering)) {
    nextPool = returnToPool(nextPool, inst);
  }
  return rollShop(nextPool, round, rng, opts);
}

/**
 * Remove the instance at a specific slot from the offering — used when
 * the player purchases that card. Returns the updated offering and the
 * taken instance. Throws if the slot is already empty.
 */
export function takeFromOffering(
  offering: ShopOffering,
  slot: number
): { offering: ShopOffering; taken: PoolInstance } {
  if (slot < 0 || slot >= offering.slots.length) {
    throw new Error(`Offering slot ${slot} out of range.`);
  }
  const taken = offering.slots[slot];
  if (!taken) {
    throw new Error(`Offering slot ${slot} is empty.`);
  }
  const slots = offering.slots.slice();
  slots[slot] = null;
  return { offering: { slots }, taken };
}
