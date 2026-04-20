import { activeHirelings } from "../board/board";
import { Board, HirelingInstance } from "../board/types";
import { CastTime } from "../cards/types";
import { computePassiveContribution } from "../customers/contributions";
import {
  applyContribution,
  createCustomerState,
  isExpired,
  isResolved,
  resolveCustomer,
  tickPatience,
} from "../customers/state";
import { AXES, Customer, CustomerState } from "../customers/types";
import { RNG } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { MIN_PRICE } from "../pricing/brackets";
import { PriceMap, buildPricingPanel } from "../pricing/panel";
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
  prices: PriceMap,
  activePotionTypes: readonly PotionTypeId[],
  rng: RNG
): ActionState {
  const states = new Map<string, HirelingActionState>();
  for (const inst of activeHirelings(board)) {
    states.set(inst.id, freshHirelingState(inst, rng));
  }
  return {
    board,
    prices,
    activePotionTypes,
    elapsedSeconds: 0,
    hirelingStates: states,
    customers: [],
    log: [],
  };
}

/**
 * Admit a new customer to the marketplace. Creates a fresh CustomerState
 * and appends a `customer-arrived` log entry stamped at the current
 * elapsed time.
 */
export function addCustomer(state: ActionState, customer: Customer): ActionState {
  const cs = createCustomerState(customer);
  return {
    ...state,
    customers: [...state.customers, cs],
    log: [
      ...state.log,
      {
        kind: "customer-arrived",
        customerId: customer.id,
        atSeconds: state.elapsedSeconds,
      },
    ],
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
 * Advance the action round by `deltaSeconds`:
 *   1. Progress every active hireling's cast timer and fire any casts
 *      whose timer expires within this tick (multiple casts per tick
 *      are supported, with overshoot carried into the next timer).
 *   2. Advance every unresolved customer: apply per-second passive
 *      contributions from each active hireling (scaled by dt), tick
 *      patience, and auto-resolve on expiration. Resolution emits a
 *      `customer-resolved` log entry.
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

  // 1. Advance cast timers and fire casts.
  for (const [instanceId, hs] of state.hirelingStates) {
    if (hs.nextCastIn === null) continue;

    let cur: HirelingActionState = {
      ...hs,
      nextCastIn: hs.nextCastIn - deltaSeconds,
    };
    let states = new Map(working.hirelingStates);
    states.set(instanceId, cur);
    working = { ...working, hirelingStates: states };

    while (cur.nextCastIn !== null && cur.nextCastIn <= 0) {
      working = fireCast(working, instanceId, rng);
      const after = working.hirelingStates.get(instanceId)!;
      if (after.nextCastIn === null) break;
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

  // 2. Advance customers.
  working = advanceCustomers(working, deltaSeconds);

  return working;
}

/**
 * Apply passive contributions and patience decay to every unresolved
 * customer. Resolution fires when patience hits zero and a log entry
 * records the outcome.
 */
function advanceCustomers(
  state: ActionState,
  deltaSeconds: number
): ActionState {
  if (state.customers.length === 0) return state;

  // Build effective prices once per tick — the board doesn't shift
  // during the action phase.
  const panel = buildPricingPanel(
    state.activePotionTypes,
    state.board,
    state.prices
  );
  const priceByType = new Map(panel.map((e) => [e.potionType, e.effectivePrice]));
  const hirelings = activeHirelings(state.board);

  const log: ActionLogEntry[] = [...state.log];
  const customers: CustomerState[] = state.customers.map((cs) => {
    if (isResolved(cs)) return cs;

    let next = cs;
    // Player-side passive contributions.
    for (const h of hirelings) {
      const price =
        (h.potionType && priceByType.get(h.potionType)) ?? MIN_PRICE;
      const contrib = computePassiveContribution(h, price, cs.customer);
      for (const axis of AXES) {
        const amount = contrib[axis] * deltaSeconds;
        if (amount > 0) {
          next = applyContribution(next, axis, "player", amount);
        }
      }
    }
    next = tickPatience(next, deltaSeconds);

    if (isExpired(next)) {
      next = resolveCustomer(next);
      log.push({
        kind: "customer-resolved",
        customerId: next.customer.id,
        atSeconds: state.elapsedSeconds,
        resolution: next.resolvedFor!,
      });
    }
    return next;
  });

  return { ...state, customers, log };
}
