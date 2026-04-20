import { activeHirelings } from "../board/board";
import { Board, HirelingInstance } from "../board/types";
import {
  addCustomer,
  applyEndOfRoundHooks,
  finalizeRound,
  initializeActionState,
  setOpponent,
  tick,
} from "../action/state";
import { Customer } from "../customers/types";
import { RNG } from "../potions/rng";
import {
  GameOutcome,
  GamePhase,
  GameState,
  MAX_ROUNDS,
  REPUTATION_MAX,
  REPUTATION_MIN,
} from "./types";
import { clampReputation } from "./state";

/**
 * Transition from `shop` → `action` for the current round. Initializes
 * an ActionState from the board, prices, and active potion types and
 * installs the opponent snapshot if one is attached to the GameState.
 */
export function endShopPhase(state: GameState, rng: RNG): GameState {
  if (state.phase !== "shop") {
    throw new Error(
      `endShopPhase: expected phase "shop", got "${state.phase}".`
    );
  }
  let action = initializeActionState(
    state.board,
    state.prices,
    state.activePotionTypes,
    rng,
    state.gold,
    state.reputation
  );
  if (state.opponent) action = setOpponent(action, state.opponent);
  return { ...state, phase: "action", action };
}

/** Admit a customer to the in-progress action round. */
export function addActionCustomer(
  state: GameState,
  customer: Customer
): GameState {
  if (state.phase !== "action" || !state.action) {
    throw new Error(
      `addActionCustomer: no action phase in progress (phase=${state.phase}).`
    );
  }
  return { ...state, action: addCustomer(state.action, customer) };
}

/** Advance the action round by `deltaSeconds`. No-op when already game-over. */
export function tickAction(
  state: GameState,
  deltaSeconds: number,
  rng: RNG
): GameState {
  if (state.phase === "game-over") return state;
  if (state.phase !== "action" || !state.action) {
    throw new Error(
      `tickAction: no action phase in progress (phase=${state.phase}).`
    );
  }
  return { ...state, action: tick(state.action, deltaSeconds, rng) };
}

/**
 * Promote per-round permanent gains on every active hireling's action
 * state onto the matching HirelingInstance's permanent bonuses — so
 * Knockoff stock and potency buffs earned this round survive into
 * subsequent rounds.
 */
function promotePermanentBuffs(state: GameState): Board {
  if (!state.action) return state.board;
  let slots = state.board.slots.slice();
  for (const h of activeHirelings(state.board)) {
    const hs = state.action.hirelingStates.get(h.id);
    if (!hs) continue;
    if (
      hs.permanentStockGainedThisRound === 0 &&
      hs.permanentPotencyGainedThisRound === 0
    ) {
      continue;
    }
    const slot = state.board.slots.findIndex((s) => s?.id === h.id);
    if (slot === -1) continue;
    const promoted: HirelingInstance = {
      ...h,
      permanentStockBonus:
        h.permanentStockBonus + hs.permanentStockGainedThisRound,
      permanentPotencyBonus:
        h.permanentPotencyBonus + hs.permanentPotencyGainedThisRound,
    };
    slots[slot] = promoted;
  }
  return { slots };
}

/** Compute the outcome + next phase given final rep, round, and customer tally. */
function resolveOutcome(
  reputation: number,
  nextRound: number,
  tally: { player: number; opponent: number }
): { outcome: GameOutcome; phase: GamePhase } {
  if (reputation >= REPUTATION_MAX) {
    return { outcome: "win", phase: "game-over" };
  }
  if (reputation <= REPUTATION_MIN) {
    return { outcome: "loss", phase: "game-over" };
  }
  if (nextRound > MAX_ROUNDS) {
    // At the end of round 15, the player wins if they beat their
    // opponent on customer count; ties or losses go to the opponent.
    return {
      outcome: tally.player > tally.opponent ? "win" : "loss",
      phase: "game-over",
    };
  }
  return { outcome: "in-progress", phase: "shop" };
}

/**
 * Close out an action round:
 *   1. `finalizeRound` force-resolves any stragglers (+ executes their
 *      sales if they resolve for the player).
 *   2. Promote per-round permanent gains onto board HirelingInstances.
 *   3. Roll up gold and reputation from the action state.
 *   4. Advance the round counter and decide the outcome (win / loss /
 *      continue-to-shop). Reputation is clamped to [-30, 30].
 *   5. Clear the action state.
 */
export function endRound(state: GameState): GameState {
  if (state.phase !== "action" || !state.action) {
    throw new Error(
      `endRound: no action phase in progress (phase=${state.phase}).`
    );
  }
  // 1. Resolve any lingering customers (idempotent).
  // 2. Run each hireling's end-of-round ability hook exactly once — MUST
  //    come after finalize so "sold nothing this round" / "Quickcraft
  //    generated > 10" reflect final totals, and MUST come before
  //    promotion so the gains carry to next round.
  const finalized = applyEndOfRoundHooks(finalizeRound(state.action));
  const boardWithBuffs = promotePermanentBuffs({
    ...state,
    action: finalized,
  });
  const nextRound = state.round + 1;
  // Tally how customers resolved this round so the round-15 tiebreaker
  // can decide on customer count (spec: beat your opponent on round 15 = win).
  const tally = { player: 0, opponent: 0 };
  for (const cs of finalized.customers) {
    if (cs.resolvedFor === "player") tally.player++;
    else if (cs.resolvedFor === "opponent") tally.opponent++;
  }
  const { outcome, phase } = resolveOutcome(finalized.reputation, nextRound, tally);

  return {
    ...state,
    round: Math.min(nextRound, MAX_ROUNDS),
    phase,
    outcome,
    gold: finalized.gold,
    reputation: clampReputation(finalized.reputation),
    board: boardWithBuffs,
    action: null,
  };
}

/** Convenience helper mainly for tests — tick in fixed steps until all customers resolve. */
export function runActionToCompletion(
  state: GameState,
  deltaSeconds: number,
  rng: RNG,
  maxIterations = 500
): GameState {
  if (state.phase !== "action" || !state.action) {
    throw new Error(
      `runActionToCompletion: no action phase in progress (phase=${state.phase}).`
    );
  }
  let current = state;
  let i = 0;
  while (
    current.action &&
    current.action.customers.some((c) => c.resolvedFor === null) &&
    i < maxIterations
  ) {
    current = tickAction(current, deltaSeconds, rng);
    i++;
  }
  return current;
}
