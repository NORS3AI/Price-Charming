/**
 * Gold costs and the starting wallet. Income comes exclusively from potion
 * sales during the action phase — there is no passive income. Unspent gold
 * rolls over between rounds.
 */

/** Gold the player starts each game with. */
export const STARTING_GOLD = 5;

/** Cost to purchase a hireling from the shop. */
export const COST_HIRELING = 2;

/** Cost to purchase a spell from the shop. */
export const COST_SPELL = 2;

/** Cost to refresh the shop. */
export const COST_REFRESH = 1;

/** Sell-back value for a hireling. Spells cannot be sold. */
export const SELL_VALUE = 1;

/** Returns true when the player can afford the given cost. */
export function canAfford(gold: number, cost: number): boolean {
  return gold >= cost;
}
