import { PotionTypeId } from "./types";

/**
 * Tracks which potion types the player has encountered so far this run.
 * The shop UI reveals only discovered types in its hover panel — the 5
 * active types are otherwise hidden at the start of the game.
 */
export interface PotionDiscovery {
  seen: ReadonlySet<PotionTypeId>;
}

/** Fresh, empty discovery tracker. */
export function createDiscovery(): PotionDiscovery {
  return { seen: new Set() };
}

/** Returns a new tracker with `id` added to the seen set. */
export function markSeen(
  discovery: PotionDiscovery,
  id: PotionTypeId
): PotionDiscovery {
  if (discovery.seen.has(id)) return discovery;
  const seen = new Set(discovery.seen);
  seen.add(id);
  return { seen };
}

/** Returns a new tracker with every `id` in `ids` added to the seen set. */
export function markSeenMany(
  discovery: PotionDiscovery,
  ids: Iterable<PotionTypeId>
): PotionDiscovery {
  const seen = new Set(discovery.seen);
  let changed = false;
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      changed = true;
    }
  }
  return changed ? { seen } : discovery;
}

/** True when the player has already encountered this potion type. */
export function isSeen(
  discovery: PotionDiscovery,
  id: PotionTypeId
): boolean {
  return discovery.seen.has(id);
}

/** Number of distinct potion types discovered so far. */
export function discoveredCount(discovery: PotionDiscovery): number {
  return discovery.seen.size;
}
