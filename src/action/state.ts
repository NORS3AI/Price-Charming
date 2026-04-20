import { activeHirelings } from "../board/board";
import { Board, HirelingInstance } from "../board/types";
import { CastTime } from "../cards/types";
import { RNG } from "../potions/rng";
import {
  ActionLogEntry,
  ActionState,
  HirelingActionState,
} from "./types";

/**
 * Compute when a hireling's very first cast of the round should fire.
 * Returns null when the hireling never casts (passive, or a
 * decreasing-cast-time hireling that starts at 0 or below).
 */
export function firstCastDelay(castTime: CastTime, rng: RNG): number | null {
  switch (castTime.kind) {
    case "passive":
      return null;
    case "seconds":
      return castTime.value;
    case "random":
      return castTime.min + rng() * (castTime.max - castTime.min);
    case "decreasing":
      return castTime.start > 0 ? castTime.start : null;
  }
}

/**
 * Compute the delay until the Nth+1 cast given how many casts have
 * already fired. Returns null when the hireling has finished casting
 * for the round (decreasing cast time has wound down to 0 or below).
 */
export function nextCastDelay(
  castTime: CastTime,
  castsSoFar: number,
  rng: RNG
): number | null {
  switch (castTime.kind) {
    case "passive":
      return null;
    case "seconds":
      return castTime.value;
    case "random":
      return castTime.min + rng() * (castTime.max - castTime.min);
    case "decreasing": {
      const next = castTime.start - castsSoFar * castTime.decrementPerCast;
      return next > 0 ? next : null;
    }
  }
}

/** Fresh per-hireling state with the first cast scheduled. */
function freshHirelingState(
  inst: HirelingInstance,
  rng: RNG
): HirelingActionState {
  return {
    instanceId: inst.id,
    castsSoFar: 0,
    nextCastIn: firstCastDelay(inst.card.castTime, rng),
    temporaryStock: 0,
    permanentStockGainedThisRound: 0,
    permanentPotencyGainedThisRound: 0,
  };
}

/**
 * Build the starting ActionState from an end-of-shop board. Only the
 * five active slots participate — bench is skipped (spec: "bench
 * hirelings do not cast or contribute passively").
 */
export function initializeActionState(
  board: Board,
  rng: RNG
): ActionState {
  const states = new Map<string, HirelingActionState>();
  for (const inst of activeHirelings(board)) {
    states.set(inst.id, freshHirelingState(inst, rng));
  }
  return {
    board,
    elapsedSeconds: 0,
    hirelingStates: states,
    log: [],
  };
}

/** Look up the Quickcraft keyword count on a hireling, or 0 if absent. */
function quickcraftCount(inst: HirelingInstance): number {
  const k = inst.card.keywords.find((x) => x.name === "Quickcraft");
  return k?.count ?? 0;
}

/**
 * Find the hireling instance behind an action state, using the board.
 * Only active-slot hirelings are tracked in hirelingStates.
 */
function findInstance(
  board: Board,
  instanceId: string
): HirelingInstance | undefined {
  return activeHirelings(board).find((h) => h.id === instanceId);
}

/**
 * Fire a single cast for one hireling: applies Quickcraft (if any),
 * increments castsSoFar, and reschedules the next cast (or marks the
 * hireling as stopped).
 */
function fireCast(
  state: ActionState,
  instanceId: string,
  rng: RNG
): ActionState {
  const prev = state.hirelingStates.get(instanceId);
  if (!prev) return state;
  const inst = findInstance(state.board, instanceId);
  if (!inst) return state;

  const castNumber = prev.castsSoFar + 1;
  const log: ActionLogEntry[] = [
    ...state.log,
    {
      kind: "cast",
      instanceId,
      atSeconds: state.elapsedSeconds,
      castNumber,
    },
  ];

  // Quickcraft: add temp stock post-cast.
  let temporaryStock = prev.temporaryStock;
  const qc = quickcraftCount(inst);
  if (qc > 0) {
    temporaryStock += qc;
    log.push({
      kind: "quickcraft",
      instanceId,
      atSeconds: state.elapsedSeconds,
      stockAdded: qc,
      temporaryStockAfter: temporaryStock,
    });
  }

  // Schedule the next cast, or mark stopped.
  const nextDelay = nextCastDelay(inst.card.castTime, castNumber, rng);
  if (nextDelay === null) {
    log.push({
      kind: "stopped",
      instanceId,
      atSeconds: state.elapsedSeconds,
      reason:
        inst.card.castTime.kind === "passive"
          ? "passive"
          : "decreasing-zero",
    });
  }

  const nextHireling: HirelingActionState = {
    ...prev,
    castsSoFar: castNumber,
    nextCastIn: nextDelay,
    temporaryStock,
  };
  const hirelingStates = new Map(state.hirelingStates);
  hirelingStates.set(instanceId, nextHireling);

  return {
    ...state,
    hirelingStates,
    log,
  };
}

/**
 * Advance the action round by `deltaSeconds`. Progresses every active
 * hireling's cast timer and fires any casts whose timer expires within
 * this tick (possibly several, if the tick is long or the cast time is
 * short). Returns a new state.
 */
export function tick(
  state: ActionState,
  deltaSeconds: number,
  rng: RNG
): ActionState {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new Error(
      `tick deltaSeconds must be a non-negative finite number (got ${deltaSeconds}).`
    );
  }
  if (deltaSeconds === 0) return state;

  let working: ActionState = {
    ...state,
    elapsedSeconds: state.elapsedSeconds + deltaSeconds,
  };

  for (const [instanceId, hs] of state.hirelingStates) {
    if (hs.nextCastIn === null) continue;

    let remaining = hs.nextCastIn - deltaSeconds;
    let cur: HirelingActionState = {
      ...hs,
      nextCastIn: remaining,
    };
    // Apply the decremented timer first.
    let states = new Map(working.hirelingStates);
    states.set(instanceId, cur);
    working = { ...working, hirelingStates: states };

    // Fire casts until the timer goes positive or the hireling stops.
    while (cur.nextCastIn !== null && cur.nextCastIn <= 0) {
      working = fireCast(working, instanceId, rng);
      const after = working.hirelingStates.get(instanceId)!;
      if (after.nextCastIn === null) break;
      // Carry any overshoot into the new timer.
      const overshoot = -(cur.nextCastIn);
      const rescheduled: HirelingActionState = {
        ...after,
        nextCastIn: after.nextCastIn - overshoot,
      };
      states = new Map(working.hirelingStates);
      states.set(instanceId, rescheduled);
      working = { ...working, hirelingStates: states };
      cur = rescheduled;
    }
  }

  return working;
}
