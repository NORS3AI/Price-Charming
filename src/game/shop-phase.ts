import { allHirelings } from "../board/board";
import { HirelingInstance } from "../board/types";
import { canAfford } from "../economy/gold";
import {
  isExemptFromPayday,
  currentWageDemand,
  survivePayday,
} from "../economy/wages";
import { PAYDAY_ROUNDS, isPaydayRound, paydayIndex } from "../economy/payday";
import { SELL_VALUE } from "../economy/gold";
import { sellHirelingFromBoardToPool } from "../shop/purchase";
import { assignPotionsToPool } from "../shop/assignment";
import { offeringInstances, refreshShop } from "../shop/offering";
import { markSeenMany } from "../potions/discovery";
import { RNG } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { GameState } from "./types";

/** Payday line-item tied to the specific hireling (board-only). */
export interface BoardPaydayLineItem {
  hireling: HirelingInstance;
  wage: number;
  canPay: boolean;
  sellValue: number;
}

/** True if the current round is one of the payday rounds (3, 6, 9, 12, 15). */
export function paydayDueNow(state: GameState): boolean {
  return isPaydayRound(state.round);
}

/**
 * Build payday line items for every non-exempt board hireling (active +
 * bench) that hasn't already been paid for this payday. Dusty Broom is
 * filtered out automatically via isExemptFromPayday. Once a hireling is
 * paid, survivePayday bumps their paydaysSurvived to the current payday
 * index, so they vanish from this list until the next payday round.
 * `canPay` is computed against the current gold.
 */
export function paydayLineItems(state: GameState): BoardPaydayLineItem[] {
  const idx = paydayIndex(state.round);
  if (idx === null) return [];
  return allHirelings(state.board)
    .filter((h) => !isExemptFromPayday(h.wageTracker))
    .filter((h) => h.wageTracker.paydaysSurvived < idx)
    .map((h) => {
      const wage = currentWageDemand(h.wageTracker);
      return {
        hireling: h,
        wage,
        canPay: canAfford(state.gold, wage),
        sellValue: SELL_VALUE,
      };
    });
}

/**
 * Pay the given board hireling's wage: deducts gold, advances its
 * wageTracker via survivePayday. Throws when the hireling isn't on the
 * board, is payday-exempt (Dusty Broom), has already been paid this
 * payday, the round isn't a payday round, or gold can't cover the wage.
 */
export function payWage(state: GameState, hirelingId: string): GameState {
  const slot = state.board.slots.findIndex((s) => s?.id === hirelingId);
  if (slot === -1) {
    throw new Error(`payWage: hireling "${hirelingId}" not on the board.`);
  }
  const hireling = state.board.slots[slot]!;
  if (isExemptFromPayday(hireling.wageTracker)) {
    throw new Error(`payWage: "${hirelingId}" is payday-exempt.`);
  }
  const idx = paydayIndex(state.round);
  if (idx === null) {
    throw new Error(
      `payWage: round ${state.round} is not a payday round (${PAYDAY_ROUNDS.join(", ")}).`
    );
  }
  if (hireling.wageTracker.paydaysSurvived >= idx) {
    throw new Error(
      `payWage: "${hirelingId}" has already been paid this payday.`
    );
  }
  const wage = currentWageDemand(hireling.wageTracker);
  if (!canAfford(state.gold, wage)) {
    throw new Error(
      `payWage: need ${wage}g, only have ${state.gold}g.`
    );
  }
  const updated: HirelingInstance = {
    ...hireling,
    wageTracker: survivePayday(hireling.wageTracker),
  };
  const slots = state.board.slots.slice();
  slots[slot] = updated;
  return {
    ...state,
    board: { slots },
    gold: state.gold - wage,
  };
}

/**
 * Sell a board hireling instead of paying. Adds SELL_VALUE to gold,
 * returns the copy to the pool (Dusty Broom disappears permanently per
 * Phase 4E's logic). Throws if the hireling isn't on the board.
 */
export function sellAtPayday(
  state: GameState,
  hirelingId: string
): GameState {
  const slot = state.board.slots.findIndex((s) => s?.id === hirelingId);
  if (slot === -1) {
    throw new Error(`sellAtPayday: hireling "${hirelingId}" not on the board.`);
  }
  const res = sellHirelingFromBoardToPool(
    state.board,
    slot,
    state.pool,
    state.gold
  );
  return { ...state, board: res.board, pool: res.pool, gold: res.gold };
}

/** Options passed through to the shop roll. */
export interface StartShopPhaseOptions {
  shopSize?: number;
  spellChance?: number;
}

/**
 * Open a fresh shop phase:
 *   1. Return any unbought cards from the previous offering back to the
 *      pool (otherwise those copies leak out of circulation over 15
 *      rounds).
 *   2. Reshuffle potion types across every pool copy (spec: done at the
 *      start of each shop phase, never on refresh).
 *   3. Roll a fresh offering for free.
 *   4. Mark every potion type visible in the new offering as
 *      discovered so the hover panel reveals them.
 *
 * Requires `phase === "shop"` — caller advances the round and sets the
 * phase via Phase 10C's `endRound` before reopening the shop.
 */
export function startShopPhase(
  state: GameState,
  rng: RNG,
  options: StartShopPhaseOptions = {}
): GameState {
  if (state.phase !== "shop") {
    throw new Error(
      `startShopPhase: expected phase "shop", got "${state.phase}".`
    );
  }
  // Return leftover offering to pool first, THEN reshuffle + re-roll.
  // refreshShop already composes return-to-pool + rollShop.
  const reshuffledPool = assignPotionsToPool(
    // Fold any leftover offering cards back into the pool before we
    // reshuffle potion types across every copy.
    offeringInstances(state.offering).reduce(
      (pool, inst) => ({ instances: [...pool.instances, inst] }),
      state.pool
    ),
    state.activePotionTypes,
    rng
  );
  // refreshShop expects the offering it's clearing — pass an empty one
  // since we already moved those back above (to be included in the
  // reshuffle). Then rolling draws from the fully-reshuffled pool.
  const rolled = refreshShop(
    { slots: state.offering.slots.map(() => null) },
    reshuffledPool,
    state.round,
    rng,
    options
  );

  // Discovery: every potion type on display now counts as encountered.
  const shownTypes: PotionTypeId[] = [];
  for (const inst of offeringInstances(rolled.offering)) {
    if (inst.card.kind === "hireling" && inst.potionType) {
      shownTypes.push(inst.potionType);
    }
  }
  const discovery = markSeenMany(state.discovery, shownTypes);

  return {
    ...state,
    pool: rolled.pool,
    offering: rolled.offering,
    discovery,
  };
}
