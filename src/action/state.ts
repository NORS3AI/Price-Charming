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
import { PriceMap, applyHaggle, buildPricingPanel } from "../pricing/panel";
import { rollUnitsPerInteraction } from "../pricing/stock";
import { OpponentSnapshot } from "../opponent/snapshot";
import {
  ActionLogEntry,
  ActionState,
  HirelingActionState,
} from "./types";
import { Weather, tickWeather } from "./weather";

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
    unitsSoldThisRound: 0,
  };
}

/** Base stock + cross-round permanent bonus + this round's gains - sold + temp. */
function effectiveStock(
  inst: HirelingInstance,
  hs: HirelingActionState
): number {
  const base = inst.card.potions[0]?.stock ?? 0;
  return (
    base +
    inst.permanentStockBonus +
    hs.permanentStockGainedThisRound +
    hs.temporaryStock -
    hs.unitsSoldThisRound
  );
}

/** Base potency + cross-round permanent bonus + this round's gains. */
function effectivePotency(
  inst: HirelingInstance,
  hs: HirelingActionState
): number {
  const base = inst.card.potions[0]?.potency ?? 0;
  return (
    base + inst.permanentPotencyBonus + hs.permanentPotencyGainedThisRound
  );
}

function hasKeyword(inst: HirelingInstance, name: string): boolean {
  return inst.card.keywords.some((k) => k.name === name);
}

function knockoffCount(inst: HirelingInstance): number {
  return inst.card.keywords.find((k) => k.name === "Knockoff")?.count ?? 0;
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
  rng: RNG,
  startingGold = 0,
  startingReputation = 0
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
    gold: startingGold,
    reputation: startingReputation,
    weather: null,
    opponent: null,
    log: [],
  };
}

/**
 * Install an async ghost opponent. The snapshot's board and prices are
 * used during `tick` to apply per-second passive contributions to the
 * opponent side of every customer's 4-axis tug-of-war.
 */
export function setOpponent(
  state: ActionState,
  snapshot: OpponentSnapshot
): ActionState {
  return { ...state, opponent: snapshot };
}

/**
 * Install a weather effect. Emits `weather-started`. Replaces any
 * currently-active weather.
 */
export function setWeather(state: ActionState, weather: Weather): ActionState {
  return {
    ...state,
    weather,
    log: [
      ...state.log,
      {
        kind: "weather-started",
        weatherId: weather.id,
        atSeconds: state.elapsedSeconds,
      },
    ],
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
 * hireling as stopped). `atSeconds` is the exact in-round time the
 * cast fires — callers must pass the true moment (pre-tick time plus
 * however much of the tick had elapsed when the timer hit 0).
 */
function fireCast(
  state: ActionState,
  instanceId: string,
  atSeconds: number,
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
      atSeconds,
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
      atSeconds,
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
      atSeconds,
      reason: "decreasing-zero",
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
 * Force-resolve every unresolved customer using its current axis state.
 * Player-leading stragglers trigger a normal sale (gold, reputation,
 * stock, Knockoff) so the caller doesn't have to tick past every
 * patience timer at round end. Emits `customer-resolved` log entries
 * to match the shape produced by `tick` resolutions.
 */
export function finalizeRound(state: ActionState): ActionState {
  if (state.customers.every((c) => c.resolvedFor !== null)) return state;

  const panel = buildPricingPanel(
    state.activePotionTypes,
    state.board,
    state.prices
  );
  const priceByType = new Map(
    panel.map((e) => [e.potionType, e.effectivePrice])
  );

  let working: ActionState = state;
  const resolvedCustomers: CustomerState[] = [];

  for (const cs of state.customers) {
    if (cs.resolvedFor !== null) {
      resolvedCustomers.push(cs);
      continue;
    }
    const next = resolveCustomer(cs);
    working = {
      ...working,
      log: [
        ...working.log,
        {
          kind: "customer-resolved",
          customerId: next.customer.id,
          atSeconds: state.elapsedSeconds,
          resolution: next.resolvedFor!,
        },
      ],
    };
    if (next.resolvedFor === "player") {
      // Execute a sale with a deterministic min-units pick — finalize
      // shouldn't consume RNG drawn for gameplay ticks. Any caller that
      // wants randomized finalize sales can tick until natural expiry.
      working = executeSale(working, next, priceByType, deterministicMinRng);
    }
    resolvedCustomers.push(next);
  }

  return { ...working, customers: resolvedCustomers };
}

/**
 * RNG stand-in that always returns 0 → rollUnitsPerInteraction lands on
 * the bracket minimum. Used by `finalizeRound` so force-resolved sales
 * stay deterministic and don't pull from gameplay RNG.
 */
const deterministicMinRng: RNG = () => 0;

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

  // 1. Advance cast timers and fire casts. fireCast is called with the
  // true in-round time of firing (pre-tick elapsed + seconds consumed
  // so far within this tick), not the end-of-tick timestamp.
  for (const [instanceId, hs] of state.hirelingStates) {
    if (hs.nextCastIn === null) continue;

    let remainingDt = deltaSeconds;
    let timeConsumed = 0;
    let currentTimer: number | null = hs.nextCastIn;

    while (currentTimer !== null && currentTimer <= remainingDt) {
      const fireAt = state.elapsedSeconds + timeConsumed + currentTimer;
      remainingDt -= currentTimer;
      timeConsumed += currentTimer;
      working = fireCast(working, instanceId, fireAt, rng);
      currentTimer = working.hirelingStates.get(instanceId)!.nextCastIn;
    }

    // Decrement the (possibly rescheduled) timer by whatever dt remains.
    if (currentTimer !== null) {
      const states = new Map(working.hirelingStates);
      states.set(instanceId, {
        ...working.hirelingStates.get(instanceId)!,
        nextCastIn: currentTimer - remainingDt,
      });
      working = { ...working, hirelingStates: states };
    }
  }

  // 2. Advance customers.
  working = advanceCustomers(working, deltaSeconds, rng);

  // 3. Tick weather — clears itself when duration expires.
  if (working.weather) {
    const nextWeather = tickWeather(working.weather, deltaSeconds);
    if (nextWeather !== working.weather) {
      const log: ActionLogEntry[] = [...working.log];
      if (nextWeather === null) {
        log.push({
          kind: "weather-cleared",
          weatherId: working.weather.id,
          atSeconds: working.elapsedSeconds,
        });
      }
      working = { ...working, weather: nextWeather, log };
    }
  }

  return working;
}

/**
 * Apply passive contributions and patience decay to every unresolved
 * customer, resolving on expiration. Player-side resolutions trigger a
 * sale via `executeSale`, which deducts stock, awards gold and
 * reputation, and fires the Knockoff keyword if applicable.
 */
function advanceCustomers(
  state: ActionState,
  deltaSeconds: number,
  rng: RNG
): ActionState {
  if (state.customers.length === 0) return state;

  const panel = buildPricingPanel(
    state.activePotionTypes,
    state.board,
    state.prices
  );
  const priceByType = new Map(panel.map((e) => [e.potionType, e.effectivePrice]));
  const hirelings = activeHirelings(state.board);

  // Opponent-side counterparts: the snapshot has its own board, active
  // types, and prices, so we derive an independent effective-price map.
  const oppHirelings = state.opponent
    ? activeHirelings(state.opponent.board)
    : [];
  const oppPriceByType = state.opponent
    ? new Map(
        buildPricingPanel(
          state.opponent.activePotionTypes,
          state.opponent.board,
          state.opponent.prices
        ).map((e) => [e.potionType, e.effectivePrice])
      )
    : new Map<PotionTypeId, number>();

  const customersAfter: CustomerState[] = [];
  let working: ActionState = state;

  for (const cs of state.customers) {
    if (isResolved(cs)) {
      customersAfter.push(cs);
      continue;
    }

    let next = cs;
    // Customers only absorb contributions while they're still waiting —
    // don't over-apply during the slice of the tick after their patience
    // would have expired.
    const activeDt = Math.min(deltaSeconds, next.patienceRemaining);
    for (const h of hirelings) {
      const price =
        (h.potionType && priceByType.get(h.potionType)) ?? MIN_PRICE;
      const contrib = computePassiveContribution(h, price, next.customer);
      for (const axis of AXES) {
        const amount = contrib[axis] * activeDt;
        if (amount > 0) {
          next = applyContribution(next, axis, "player", amount);
        }
      }
    }
    // Opponent-side passive contributions (ghost snapshot).
    for (const h of oppHirelings) {
      const price =
        (h.potionType && oppPriceByType.get(h.potionType)) ?? MIN_PRICE;
      const contrib = computePassiveContribution(h, price, next.customer);
      for (const axis of AXES) {
        const amount = contrib[axis] * activeDt;
        if (amount > 0) {
          next = applyContribution(next, axis, "opponent", amount);
        }
      }
    }
    next = tickPatience(next, deltaSeconds);

    if (isExpired(next)) {
      next = resolveCustomer(next);
      working = {
        ...working,
        log: [
          ...working.log,
          {
            kind: "customer-resolved",
            customerId: next.customer.id,
            atSeconds: state.elapsedSeconds,
            resolution: next.resolvedFor!,
          },
        ],
      };
      if (next.resolvedFor === "player") {
        working = executeSale(working, next, priceByType, rng);
      }
    }
    customersAfter.push(next);
  }

  return { ...working, customers: customersAfter };
}

/**
 * Pick the hireling that rings up this customer: among active hirelings
 * matching the customer's desired potion type and carrying at least one
 * unit of effective stock, choose the highest effective potency. Ties
 * broken by active-slot order. Returns null when nobody can sell.
 */
function pickSalesHireling(
  state: ActionState,
  desiredType: string
): HirelingInstance | null {
  let best: HirelingInstance | null = null;
  let bestPotency = -1;
  for (const h of activeHirelings(state.board)) {
    if (h.potionType !== desiredType) continue;
    const hs = state.hirelingStates.get(h.id);
    if (!hs) continue;
    if (effectiveStock(h, hs) <= 0) continue;
    const pot = effectivePotency(h, hs);
    if (pot > bestPotency) {
      best = h;
      bestPotency = pot;
    }
  }
  return best;
}

/**
 * Execute a player-win sale: deplete stock, add gold, add reputation,
 * apply Haggle (+3g, -1 rep per sale), trigger Knockoff (if current
 * potency < 10, gain +N permanent stock this round). Emits `sale` and
 * optional `knockoff` log entries.
 */
function executeSale(
  state: ActionState,
  customerState: CustomerState,
  priceByType: Map<string, number>,
  rng: RNG
): ActionState {
  const hireling = pickSalesHireling(state, customerState.customer.desiredType);
  if (!hireling) return state; // Nothing to sell — resolve stands, no gold/rep.

  const hs = state.hirelingStates.get(hireling.id)!;
  const available = effectiveStock(hireling, hs);
  const units = rollUnitsPerInteraction(available, rng);
  if (units <= 0) return state;

  const basePrice = priceByType.get(hireling.potionType!) ?? MIN_PRICE;
  const haggled = hasKeyword(hireling, "Haggle");
  const pricePerUnit = applyHaggle(basePrice, hireling);
  const goldEarned = units * pricePerUnit;
  const reputationDelta =
    customerState.customer.reputationStars - (haggled ? 1 : 0);

  const log: ActionLogEntry[] = [
    ...state.log,
    {
      kind: "sale",
      customerId: customerState.customer.id,
      instanceId: hireling.id,
      unitsSold: units,
      pricePerUnit,
      goldEarned,
      reputationDelta,
      haggled,
      atSeconds: state.elapsedSeconds,
    },
  ];

  // Update hireling action state: consume stock.
  let nextHs: HirelingActionState = {
    ...hs,
    unitsSoldThisRound: hs.unitsSoldThisRound + units,
  };

  // Knockoff: after sell, if current potency < 10, gain +N permanent stock.
  const knockoff = knockoffCount(hireling);
  if (knockoff > 0 && effectivePotency(hireling, hs) < 10) {
    nextHs = {
      ...nextHs,
      permanentStockGainedThisRound:
        nextHs.permanentStockGainedThisRound + knockoff,
    };
    log.push({
      kind: "knockoff",
      instanceId: hireling.id,
      stockGained: knockoff,
      atSeconds: state.elapsedSeconds,
    });
  }

  const hirelingStates = new Map(state.hirelingStates);
  hirelingStates.set(hireling.id, nextHs);

  return {
    ...state,
    hirelingStates,
    gold: state.gold + goldEarned,
    reputation: state.reputation + reputationDelta,
    log,
  };
}
