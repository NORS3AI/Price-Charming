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
 * Apply a permanent buff (stock / potency) to a target hireling's
 * per-round gain fields, appending an `ability-buff` log entry. The
 * buff carries into the HirelingInstance's permanent bonuses when
 * endRound runs promotePermanentBuffs.
 */
function buffHireling(
  state: ActionState,
  casterId: string,
  targetId: string,
  stockGained: number,
  potencyGained: number,
  atSeconds: number
): ActionState {
  if (stockGained === 0 && potencyGained === 0) return state;
  const hs = state.hirelingStates.get(targetId);
  if (!hs) return state;
  const next: HirelingActionState = {
    ...hs,
    permanentStockGainedThisRound:
      hs.permanentStockGainedThisRound + stockGained,
    permanentPotencyGainedThisRound:
      hs.permanentPotencyGainedThisRound + potencyGained,
  };
  const states = new Map(state.hirelingStates);
  states.set(targetId, next);
  const log: ActionLogEntry[] = [
    ...state.log,
    {
      kind: "ability-buff",
      casterId,
      targetId,
      stockGained,
      potencyGained,
      atSeconds,
    },
  ];
  return { ...state, hirelingStates: states, log };
}

/**
 * Per-card post-own-sale ability hook. Fires inside executeSale AFTER
 * Knockoff so both can stack. Returns the updated state (can buff self
 * or allies).
 *
 *   - jumping-jack: "After this sells, gain +1 permanent stock and
 *                    +1 permanent potency."
 *   - confectioner: "After this sells, all Sugar Guild allies gain +1
 *                    potency permanently." (Haggled or not.)
 *   - street-rat:   "If Haggled sale succeeds, gain +2 permanent stock."
 */
function applyPostSaleAbility(
  state: ActionState,
  hireling: HirelingInstance,
  haggled: boolean,
  atSeconds: number
): ActionState {
  switch (hireling.card.id) {
    case "jumping-jack":
      return buffHireling(state, hireling.id, hireling.id, 1, 1, atSeconds);
    case "confectioner":
      return buffActiveAllies(state, hireling, 0, 1, atSeconds, (h) =>
        h.card.kind === "hireling" && h.card.guild === "Sugar Guild"
      );
    case "street-rat":
      // Haggle sales only.
      if (!haggled) return state;
      return buffHireling(state, hireling.id, hireling.id, 2, 0, atSeconds);
    default:
      return state;
  }
}

/**
 * Per-card post-ANY-ally-sale reactive hook. Runs for every active ally
 * of the seller each time a sale fires. Used by cards like Gingerbread
 * King whose buff triggers on other hirelings' sales.
 *
 *   - gingerbread-king: "After an ally sells, gain +2 potency (permanent)."
 */
function applyOnAllySaleAbility(
  state: ActionState,
  reactor: HirelingInstance,
  seller: HirelingInstance,
  atSeconds: number
): ActionState {
  if (reactor.id === seller.id) return state; // Not reactive to own sale.
  switch (reactor.card.id) {
    case "gingerbread-king":
      return buffHireling(state, seller.id, reactor.id, 0, 2, atSeconds);
    default:
      return state;
  }
}

/**
 * End-of-round ability hook. Runs once per active hireling inside
 * finalizeRound, after all lingering customers have been resolved, so
 * conditions like "sold nothing this round" or "total Quickcraft stock
 * > 10" reflect final round totals.
 *
 *   - burnt-batch: "If this sells nothing this round, gain +6 potency
 *                   permanently."
 *   - glazier:     "If total temporary stock generated this round
 *                   exceeds 10, gain +3 permanent potency."
 */
function applyEndOfRoundAbility(
  state: ActionState,
  inst: HirelingInstance,
  atSeconds: number
): ActionState {
  const hs = state.hirelingStates.get(inst.id);
  if (!hs) return state;
  switch (inst.card.id) {
    case "burnt-batch":
      if (hs.unitsSoldThisRound === 0) {
        return buffHireling(state, inst.id, inst.id, 0, 6, atSeconds);
      }
      return state;
    case "glazier": {
      // temporaryStock is the running tally that hasn't been sold; but
      // the spec asks about total generated. Quickcraft count × casts so
      // far tells us what was produced even after sales depleted it.
      const generated = quickcraftCount(inst) * hs.castsSoFar;
      if (generated > 10) {
        return buffHireling(state, inst.id, inst.id, 0, 3, atSeconds);
      }
      return state;
    }
    default:
      return state;
  }
}

/**
 * Per-card on-cast ability hook. Fires AFTER the keyword pass (so
 * Quickcraft's temp stock is already recorded). Returns the updated
 * state. The registry below maps card.id → (state, caster, atSeconds)
 * transformers; cards not in the registry don't contribute extra
 * effects beyond their keywords.
 */
function applyPostCastAbility(
  state: ActionState,
  caster: HirelingInstance,
  atSeconds: number
): ActionState {
  switch (caster.card.id) {
    case "sugar-sprinkler":
      // "Adjacent allies gain +1 potency (permanent)."
      return buffActiveAdjacent(state, caster, 0, 1, atSeconds);
    case "oven-master":
      // "Quickcraft x5. Allies gain +2 potency (permanent)."
      return buffActiveAllies(state, caster, 0, 2, atSeconds);
    case "lord-chamberlain":
      // "All Nobles Guild allies gain +1 permanent stock and +1
      //  permanent potency. This effect doubles during the action round
      //  immediately following payday." (Payday-double not implemented.)
      return buffActiveAllies(state, caster, 1, 1, atSeconds, (h) =>
        h.card.kind === "hireling" && h.card.guild === "Nobles Guild"
      );
    case "snatchling":
      // "Knockoff x2. Spend -1 Reputation. Gain +4 permanent stock."
      return buffHireling(
        { ...state, reputation: state.reputation - 1 },
        caster.id,
        caster.id,
        4,
        0,
        atSeconds
      );
    case "fence-master":
      // "Knockoff x3. Haggle. Spend -1 Reputation. All Thieves allies
      //  gain +1 permanent stock."
      return buffActiveAllies(
        { ...state, reputation: state.reputation - 1 },
        caster,
        1,
        0,
        atSeconds,
        (h) => h.card.kind === "hireling" && h.card.guild === "Thieves Guild"
      );
    case "ogreachiever":
      // "All active hirelings gain +1 permanent potency. (Does not apply
      //  to hirelings with Quickcraft.)"
      return buffActiveAllies(state, caster, 0, 1, atSeconds, (h) =>
        h.card.kind === "hireling" && quickcraftCount(h) === 0
      );
    case "the-duchess":
      // "Only applies to Nobles Guild Allies: All allies to the left
      //  gain +1 permanent stock. All allies to the right gain +1
      //  permanent potency." Self-buff clause requires a Nobles ally on
      //  both sides.
      return applyDuchessBuffs(state, caster, atSeconds);
    default:
      return state;
  }
}

/**
 * The Duchess: directional noble-only buffs. Allies left of her gain
 * +1 permanent stock; right gain +1 permanent potency. If at least one
 * Nobles ally exists on each side, she also gains the same buffs herself
 * (+1 stock +1 potency).
 */
function applyDuchessBuffs(
  state: ActionState,
  caster: HirelingInstance,
  atSeconds: number
): ActionState {
  const casterSlot = state.board.slots.findIndex((s) => s?.id === caster.id);
  if (casterSlot === -1) return state;
  let working = state;
  let leftNoble = false;
  let rightNoble = false;
  for (let i = 0; i < state.board.slots.length; i++) {
    const h = state.board.slots[i];
    if (!h || h.id === caster.id) continue;
    if (h.card.kind !== "hireling" || h.card.guild !== "Nobles Guild") continue;
    if (!working.hirelingStates.has(h.id)) continue; // active slot only
    if (i < casterSlot) {
      working = buffHireling(working, caster.id, h.id, 1, 0, atSeconds);
      leftNoble = true;
    } else if (i > casterSlot) {
      working = buffHireling(working, caster.id, h.id, 0, 1, atSeconds);
      rightNoble = true;
    }
  }
  if (leftNoble && rightNoble) {
    working = buffHireling(working, caster.id, caster.id, 1, 1, atSeconds);
  }
  return working;
}

/** Buff the two active-slot neighbors immediately left + right of the caster. */
function buffActiveAdjacent(
  state: ActionState,
  caster: HirelingInstance,
  stock: number,
  potency: number,
  atSeconds: number
): ActionState {
  const casterSlot = state.board.slots.findIndex((s) => s?.id === caster.id);
  if (casterSlot === -1) return state;
  let working = state;
  for (const neighborSlot of [casterSlot - 1, casterSlot + 1]) {
    if (neighborSlot < 0 || neighborSlot >= state.board.slots.length) continue;
    // Bench adjacency matters only when the neighbor is on an active
    // slot (bench hirelings don't participate in the action phase, so
    // they have no HirelingActionState entry anyway).
    const neighbor = state.board.slots[neighborSlot];
    if (!neighbor) continue;
    working = buffHireling(
      working,
      caster.id,
      neighbor.id,
      stock,
      potency,
      atSeconds
    );
  }
  return working;
}

/**
 * Buff every active-slot ally (caster excluded), optionally filtered
 * (e.g. Lord Chamberlain buffs only Nobles Guild allies).
 */
function buffActiveAllies(
  state: ActionState,
  caster: HirelingInstance,
  stock: number,
  potency: number,
  atSeconds: number,
  filter?: (h: HirelingInstance) => boolean
): ActionState {
  let working = state;
  for (const h of activeHirelings(state.board)) {
    if (h.id === caster.id) continue;
    if (filter && !filter(h)) continue;
    working = buffHireling(working, caster.id, h.id, stock, potency, atSeconds);
  }
  return working;
}

/**
 * Fire a single cast for one hireling: applies Quickcraft (if any),
 * runs per-card ability effects, increments castsSoFar, and reschedules
 * the next cast (or marks the hireling as stopped). `atSeconds` is the
 * exact in-round time the cast fires — callers must pass the true
 * moment (pre-tick time plus however much of the tick had elapsed when
 * the timer hit 0).
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

  // After updating the caster's own state, fire per-card ability
  // effects (e.g. Sugar Sprinkler buffs adjacent allies). These may
  // mutate OTHER hirelings' action states.
  const withCasterState: ActionState = {
    ...state,
    hirelingStates,
    log,
  };
  return applyPostCastAbility(withCasterState, inst, atSeconds);
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
 * Run every active hireling's end-of-round ability hook once. Intended
 * to be called from `endRound` AFTER `finalizeRound` (so totals are
 * settled) and BEFORE `promotePermanentBuffs` (so gains carry across
 * rounds). Kept separate from `finalizeRound` to preserve that
 * function's idempotency — double-calling end-of-round hooks would
 * double-apply Burnt Batch's +6 potency, Glazier's +3 potency, etc.
 */
export function applyEndOfRoundHooks(state: ActionState): ActionState {
  let working = state;
  for (const inst of activeHirelings(working.board)) {
    working = applyEndOfRoundAbility(working, inst, working.elapsedSeconds);
  }
  return working;
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
  const desired = customerState.customer.desiredUnits ?? 1;
  const rolled = rollUnitsPerInteraction(available, rng);
  // Customer buys at least their desiredUnits (if stock allows), and up
  // to whatever the stock bracket rolls on top of that. Lets customer
  // demand scale with round without ignoring stock brackets.
  const units = Math.min(available, Math.max(desired, rolled));
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

  let working: ActionState = {
    ...state,
    hirelingStates,
    gold: state.gold + goldEarned,
    reputation: state.reputation + reputationDelta,
    log,
  };

  // Per-card on-sale ability hook for the seller (e.g. Jumping Jack,
  // Confectioner, Street Rat). Runs AFTER Knockoff so they can stack
  // on a single sale.
  working = applyPostSaleAbility(working, hireling, haggled, state.elapsedSeconds);

  // Per-card reactive hook for every OTHER active ally (e.g. Gingerbread
  // King: +2 potency whenever any ally sells).
  for (const ally of activeHirelings(state.board)) {
    if (ally.id === hireling.id) continue;
    working = applyOnAllySaleAbility(working, ally, hireling, state.elapsedSeconds);
  }

  return working;
}
