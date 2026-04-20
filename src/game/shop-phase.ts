import { allHirelings } from "../board/board";
import { HirelingInstance } from "../board/types";
import { canAfford } from "../economy/gold";
import {
  isExemptFromPayday,
  currentWageDemand,
  survivePayday,
} from "../economy/wages";
import { isPaydayRound } from "../economy/payday";
import { SELL_VALUE } from "../economy/gold";
import { sellHirelingFromBoardToPool } from "../shop/purchase";
import { assignPotionsToPool } from "../shop/assignment";
import { rollShop } from "../shop/offering";
import { RNG } from "../potions/rng";
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
 * bench). Dusty Broom is filtered out automatically via
 * isExemptFromPayday. `canPay` is computed against the current gold.
 */
export function paydayLineItems(state: GameState): BoardPaydayLineItem[] {
  return allHirelings(state.board)
    .filter((h) => !isExemptFromPayday(h.wageTracker))
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
 * board, is payday-exempt (Dusty Broom), or gold can't cover the wage.
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
 * Open a fresh shop phase: reshuffle potion types across every pool
 * copy (spec: done at the start of each shop phase, never on refresh),
 * then roll a fresh offering for free. Requires `phase === "shop"` —
 * caller advances the round and sets the phase via Phase 10C's
 * `endRound` before reopening the shop.
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
  const reshuffled = assignPotionsToPool(
    state.pool,
    state.activePotionTypes,
    rng
  );
  const rolled = rollShop(reshuffled, state.round, rng, options);
  return {
    ...state,
    pool: rolled.pool,
    offering: rolled.offering,
  };
}
