import { activeHirelings } from "../board/board";
import { Board, HirelingInstance } from "../board/types";
import { CastTime } from "../cards/types";
import { computePassiveContribution } from "../customers/contributions";
import {
  applyContribution,
  createCustomerState,
  determineEarlyWinner,
  isExpired,
  isResolved,
  resolveCustomer,
  tickPatience,
} from "../customers/state";
import { AXES, AXIS_THRESHOLD, Customer, CustomerState } from "../customers/types";
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

/**
 * Compute this hireling's effective cast time given current board
 * composition. Normally this is just `inst.card.castTime`, but some
 * cards alter their own cast time based on allies:
 *
 *   - rush-order-cook: "-1s cast time for each other Sugar Guild ally."
 *     Minimum 1s. A zero-second cast time would spin the fireCast loop
 *     (`currentTimer <= remainingDt` would be 0 <= positive forever,
 *     since subtracting 0 doesn't reduce remainingDt).
 *
 * The board is immutable during the action phase, so the result is
 * stable across a round — callers may cache it, but we recompute each
 * time for simplicity.
 */
function effectiveCastTime(inst: HirelingInstance, board: Board, weather?: Weather | null): CastTime {
  const base = inst.card.castTime;
  let speedup = 0;
  // Heatwave-style weather: shave seconds off cast time for a guild.
  const w = weather?.effect.castSpeedupForGuild;
  if (w && inst.card.guild === w.guild) {
    speedup += w.seconds;
  }
  switch (inst.card.id) {
    case "rush-order-cook": {
      if (base.kind !== "seconds") return base;
      const sugarAllies = activeHirelings(board).filter(
        (h) =>
          h.id !== inst.id &&
          h.card.kind === "hireling" &&
          h.card.guild === "Sugar Guild"
      ).length;
      const adjusted = Math.max(1, base.value - sugarAllies - speedup);
      return { kind: "seconds", value: adjusted };
    }
    default:
      if (base.kind === "seconds" && speedup > 0) {
        return { kind: "seconds", value: Math.max(1, base.value - speedup) };
      }
      return base;
  }
}

/** Fresh per-hireling state with the first cast scheduled. */
function freshHirelingState(
  inst: HirelingInstance,
  board: Board,
  rng: RNG
): HirelingActionState {
  return {
    instanceId: inst.id,
    castsSoFar: 0,
    nextCastIn: firstCastDelay(effectiveCastTime(inst, board), rng),
    temporaryStock: 0,
    permanentStockGainedThisRound: 0,
    permanentPotencyGainedThisRound: 0,
    unitsSoldThisRound: 0,
    temporaryStock2: 0,
    permanentStockGainedThisRound2: 0,
    permanentPotencyGainedThisRound2: 0,
    unitsSoldThisRound2: 0,
    potencyGainsDoubled: false,
    bonusQuickcraftPerCast: 0,
    bewitchLevel: 1,
  };
}

/**
 * Base stock + cross-round permanent bonus + this round's gains - sold
 * + temp, for the given slot index (0 = primary, 1 = secondary).
 */
function effectiveStock(
  inst: HirelingInstance,
  hs: HirelingActionState,
  slot: 0 | 1 = 0
): number {
  const base = inst.card.potions[slot]?.stock ?? 0;
  if (slot === 1) {
    return (
      base +
      inst.permanentStockBonus2 +
      hs.permanentStockGainedThisRound2 +
      hs.temporaryStock2 -
      hs.unitsSoldThisRound2
    );
  }
  return (
    base +
    inst.permanentStockBonus +
    hs.permanentStockGainedThisRound +
    hs.temporaryStock -
    hs.unitsSoldThisRound
  );
}

/** Base potency + cross-round permanent bonus + this round's gains, per slot. */
function effectivePotency(
  inst: HirelingInstance,
  hs: HirelingActionState,
  slot: 0 | 1 = 0
): number {
  const base = inst.card.potions[slot]?.potency ?? 0;
  if (slot === 1) {
    return (
      base +
      inst.permanentPotencyBonus2 +
      hs.permanentPotencyGainedThisRound2
    );
  }
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
    states.set(inst.id, freshHirelingState(inst, board, rng));
  }
  let state: ActionState = {
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
  // Per-card round-start abilities that don't need an opponent (Goblin
  // King mutual buff, Royal Tutor, Kingmaker, Tower Escapee). Cards
  // that READ the opponent (Batter Boy, Frosted Lookout) need
  // `runRoundStartHooks` re-run after setOpponent — see endShopPhase.
  for (const inst of activeHirelings(board)) {
    state = applyRoundStartAbility(state, inst, 0, rng);
  }
  return state;
}

/** Card ids whose round-start hook needs to read state.opponent. */
const OPPONENT_DEPENDENT_ROUND_START = new Set<string>([
  "batter-boy",
  "frosted-lookout",
]);

/**
 * Run the OPPONENT-DEPENDENT round-start hooks. Called by endShopPhase
 * AFTER setOpponent so Batter Boy / Frosted Lookout can read the
 * snapshot. Idempotent for all other cards (filtered out by id).
 */
export function runOpponentDependentRoundStartHooks(
  state: ActionState,
  rng: RNG
): ActionState {
  let working = state;
  for (const inst of activeHirelings(working.board)) {
    if (!OPPONENT_DEPENDENT_ROUND_START.has(inst.card.id)) continue;
    working = applyRoundStartAbility(working, inst, 0, rng);
  }
  return working;
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
  // Apply castSpeedupForGuild RETROACTIVELY to in-flight nextCastIn so
  // weather kicks in on the FIRST upcoming cast rather than waiting
  // for a reschedule. Without this, freshHirelingState's pre-weather
  // first-cast delay would dominate until the second cast.
  let states = state.hirelingStates;
  const speedup = weather.effect.castSpeedupForGuild;
  if (speedup) {
    const nextStates = new Map(state.hirelingStates);
    let dirty = false;
    for (const inst of activeHirelings(state.board)) {
      if (inst.card.guild !== speedup.guild) continue;
      const hs = nextStates.get(inst.id);
      if (!hs || hs.nextCastIn === null) continue;
      nextStates.set(inst.id, {
        ...hs,
        nextCastIn: Math.max(0.1, hs.nextCastIn - speedup.seconds),
      });
      dirty = true;
    }
    if (dirty) states = nextStates;
  }
  return {
    ...state,
    hirelingStates: states,
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
/**
 * Walk the log backwards for the most recent ability-buff entry.
 * Used by Court Scribe and Grand Vizier to find "the last permanent
 * buff any ally gained this round." Returns null when the log has
 * no ability-buff entries yet.
 */
function findLastAbilityBuff(
  log: readonly ActionLogEntry[]
): Extract<ActionLogEntry, { kind: "ability-buff" }> | null {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e.kind === "ability-buff") return e;
  }
  return null;
}

function buffHireling(
  state: ActionState,
  casterId: string,
  targetId: string,
  stockGained: number,
  potencyGained: number,
  atSeconds: number,
  reentrant = false
): ActionState {
  if (stockGained === 0 && potencyGained === 0) return state;
  const hs = state.hirelingStates.get(targetId);
  if (!hs) return state;
  // Dusty Broom ability text: "Cannot be Sabotaged. Cannot be buffed."
  // Applies uniformly — positive OR negative buffs from every source
  // (Sugar Sprinkler's adjacency, Oven Master's all-ally, Lord
  // Chamberlain's Nobles filter, Grumblegut Dragon's eat, etc.).
  const target = findInstance(state.board, targetId);
  if (target?.card.id === "dusty-broom") return state;
  // Kingmaker: a chosen Nobles ally has potencyGainsDoubled=true for
  // the round. Any positive potency buff lands at 2× — stock isn't
  // doubled per the card text ("Potency gains").
  const effectivePotencyGain =
    hs.potencyGainsDoubled && potencyGained > 0 ? potencyGained * 2 : potencyGained;
  const next: HirelingActionState = {
    ...hs,
    permanentStockGainedThisRound:
      hs.permanentStockGainedThisRound + stockGained,
    permanentPotencyGainedThisRound:
      hs.permanentPotencyGainedThisRound + effectivePotencyGain,
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
  let working: ActionState = { ...state, hirelingStates: states, log };
  // Phase 6 buff-event bus: every buffHireling call fires the
  // reactive hook for each OTHER active ally (skipping the buffed
  // target so it doesn't react to its own gain). Pass `reentrant=true`
  // on recursive calls so reactive cards that themselves call
  // buffHireling (e.g. Court Scribe's amplification) don't trigger
  // ANOTHER round of reactions and infinite-loop. Court Jester's
  // reactions use direct hirelingState mutation to stay outside this
  // path.
  if (!reentrant && target) {
    for (const ally of activeHirelings(working.board)) {
      if (ally.id === targetId) continue;
      working = applyOnPermanentBuffEvent(
        working,
        ally,
        { casterId, targetId, stockGained, potencyGained, atSeconds },
        atSeconds
      );
    }
  }
  return working;
}

/**
 * Phase 6 reactive hook fired for each OTHER active ally each time a
 * permanent buff is applied to anyone (any buffHireling call). Cards
 * that listen for "ally gained permanent stock/potency" events live
 * here.
 *
 *   - court-jester: "When any ally gains a stock buff, gain +1
 *                    temporary stock. When any ally gains a potency
 *                    buff, gain +1 temporary potency." (Treated as
 *                    +1 temporary stock and +1 permanent potency
 *                    gained this round, since there's no
 *                    temporaryPotency tracker yet — gain still
 *                    promotes at round end.)
 *   - the-candy-architect: "Each time any Sugar Guild ally gains
 *                            permanent potency this round, this
 *                            hireling's next Quickcraft generates +2
 *                            additional stock." Translated MVP-style
 *                            to: +2 permanent stock gained this round
 *                            per Sugar potency event (so the boost
 *                            STILL benefits the player but applies
 *                            now rather than at next-cast time).
 */
function applyOnPermanentBuffEvent(
  state: ActionState,
  reactor: HirelingInstance,
  event: {
    casterId: string;
    targetId: string;
    stockGained: number;
    potencyGained: number;
    atSeconds: number;
  },
  atSeconds: number
): ActionState {
  switch (reactor.card.id) {
    case "court-jester": {
      let working = state;
      if (event.stockGained > 0) {
        working = addTemporaryStock(working, reactor.id, 1);
      }
      if (event.potencyGained > 0) {
        // Direct hirelingState mutation to avoid recursing through
        // buffHireling (which would re-fire this very hook).
        const hs = working.hirelingStates.get(reactor.id);
        if (hs) {
          const states = new Map(working.hirelingStates);
          states.set(reactor.id, {
            ...hs,
            permanentPotencyGainedThisRound: hs.permanentPotencyGainedThisRound + 1,
          });
          working = { ...working, hirelingStates: states };
        }
      }
      return working;
    }
    case "the-candy-architect": {
      // Only fires when a Sugar Guild ally is the target AND the
      // event grants permanent potency.
      if (event.potencyGained <= 0) return state;
      const target = findInstance(state.board, event.targetId);
      if (!target || target.card.kind !== "hireling" || target.card.guild !== "Sugar Guild") return state;
      // +2 permanent stock to the architect, recorded as a normal
      // buffHireling call (reentrant to skip the reactive cascade).
      return buffHireling(state, reactor.id, reactor.id, 2, 0, atSeconds, true);
    }
    default:
      return state;
  }
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
    case "cookie-seller": {
      // "First sale each round grants +1 gold." Count sale log entries
      // — the current sale is already logged, so count === 1 means this
      // was the first one this round.
      const saleCount = state.log.filter(
        (e) => e.kind === "sale" && e.instanceId === hireling.id
      ).length;
      if (saleCount !== 1) return state;
      return { ...state, gold: state.gold + 1 };
    }
    case "almost-a-knight":
      // "Haggle. If Haggled sale succeeds, gain +2 temporary stock."
      if (!haggled) return state;
      return addTemporaryStock(state, hireling.id, 2);
    case "pickpocket-pixie": {
      // "After this sells, gain +1 temporary stock for every Thieves
      // hireling in play (including opponent's)." Counts self.
      const playerThieves = state.board.slots.filter(
        (s) => s && s.card.kind === "hireling" && s.card.guild === "Thieves Guild"
      ).length;
      const oppThieves = state.opponent
        ? state.opponent.board.slots.filter(
            (s) => s && s.card.kind === "hireling" && s.card.guild === "Thieves Guild"
          ).length
        : 0;
      const total = playerThieves + oppThieves;
      if (total <= 0) return state;
      return addTemporaryStock(state, hireling.id, total);
    }
    default:
      return state;
  }
}

/** Add to a target active hireling's temporary stock pool. Returns state unchanged if target isn't on an active slot or is Dusty Broom (cannot be buffed). */
function addTemporaryStock(
  state: ActionState,
  targetId: string,
  amount: number
): ActionState {
  if (amount <= 0) return state;
  const hs = state.hirelingStates.get(targetId);
  if (!hs) return state;
  const target = findInstance(state.board, targetId);
  if (target?.card.id === "dusty-broom") return state;
  const states = new Map(state.hirelingStates);
  states.set(targetId, { ...hs, temporaryStock: hs.temporaryStock + amount });
  return { ...state, hirelingStates: states };
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
    case "the-page":
      // "When an ally sells, gain +1 temporary stock."
      return addTemporaryStock(state, reactor.id, 1);
    default:
      return state;
  }
}

/**
 * Per-card reactive hook fired when any OTHER active ally casts. Used
 * by cards like Apprentice Baker whose buff triggers on Quickcraft
 * pulses from teammates.
 *
 *   - apprentice-baker: "After an ally uses Quickcraft, gain +1
 *                        temporary stock." (Only fires if the caster
 *                        actually produced Quickcraft stock.)
 */
function applyOnAllyCastAbility(
  state: ActionState,
  reactor: HirelingInstance,
  caster: HirelingInstance,
  atSeconds: number
): ActionState {
  if (reactor.id === caster.id) return state;
  switch (reactor.card.id) {
    case "apprentice-baker":
      // Only react if the caster had Quickcraft (otherwise the cast
      // wasn't a Quickcraft cast).
      if (quickcraftCount(caster) <= 0) return state;
      return addTemporaryStock(state, reactor.id, 1);
    default:
      return state;
  }
}

/**
 * Per-card reactive hook for customer resolutions that did NOT go to
 * the player (no-sale or opponent win). Fires once per unresolved → no-
 * player-sale transition in tick and finalizeRound.
 *
 *   - nimble-ned: "When a customer buys nothing from your hirelings,
 *                  pickpocket +1 gold from them, if you have at least
 *                  2 other Thieves Guild allies in play." (Active slots.)
 */
/**
 * Tasting Table redirect: when a customer would resolve as no-sale AND
 * a Tasting Table is on an active slot AND her slot 0 or slot 1 matches
 * the customer's desired type AND that slot has stock, promote the
 * resolution to "player" and grant +1 temp stock to every other Sugar
 * Guild ally on an active slot. Returns both the (possibly mutated)
 * state and the (possibly upgraded) customer state.
 *
 * Called from BOTH the per-tick advanceCustomers path AND the
 * end-of-round finalizeRound force-resolve path so customers expiring
 * mid-tick OR at finalize both benefit.
 */
function applyTastingTableRedirect(
  state: ActionState,
  cs: CustomerState
): { state: ActionState; customerState: CustomerState } {
  if (cs.resolvedFor !== "no-sale") return { state, customerState: cs };
  const tasting = activeHirelings(state.board).find(
    (h) => h.card.id === "tasting-table"
  );
  if (!tasting) return { state, customerState: cs };
  const tastingHs = state.hirelingStates.get(tasting.id);
  if (!tastingHs) return { state, customerState: cs };
  const slot: 0 | 1 =
    tasting.potionType === cs.customer.desiredType ? 0 :
    tasting.potionType2 === cs.customer.desiredType ? 1 : -1 as 0 | 1;
  if (slot === (-1 as 0 | 1)) return { state, customerState: cs };
  if (effectiveStock(tasting, tastingHs, slot) <= 0) return { state, customerState: cs };

  const upgraded: CustomerState = { ...cs, resolvedFor: "player" };
  let working = state;
  for (const ally of activeHirelings(working.board)) {
    if (ally.id === tasting.id) continue;
    if (ally.card.guild !== "Sugar Guild") continue;
    working = addTemporaryStock(working, ally.id, 1);
  }
  return { state: working, customerState: upgraded };
}

function applyOnNoPlayerSaleAbility(
  state: ActionState,
  reactor: HirelingInstance,
  atSeconds: number,
  customer?: Customer
): ActionState {
  switch (reactor.card.id) {
    case "nimble-ned": {
      const otherThieves = activeHirelings(state.board).filter(
        (h) =>
          h.id !== reactor.id &&
          h.card.kind === "hireling" &&
          h.card.guild === "Thieves Guild"
      ).length;
      if (otherThieves < 2) return state;
      return { ...state, gold: state.gold + 1 };
    }
    case "spare-charming": {
      // "If Haggled sale fails, gain +3 permanent potency." Only fires
      // when the customer's desired type matches Spare Charming's
      // own potion(s) AND Spare Charming carries the Haggle keyword
      // — i.e. the no-sale really WAS Spare's failed haggle, not a
      // walk-away from a different stall.
      if (!customer) return state;
      const matches =
        reactor.potionType === customer.desiredType ||
        reactor.potionType2 === customer.desiredType;
      if (!matches) return state;
      if (!reactor.card.keywords.some((k) => k.name === "Haggle")) return state;
      return buffHireling(state, reactor.id, reactor.id, 0, 3, atSeconds, true);
    }
    default:
      return state;
  }
}

/**
 * Round-start ability hook. Runs once per active hireling at
 * initializeActionState, before any cast fires.
 *
 *   - goblin-king: "If Robbin Goblin is on your board, both gain +3
 *                   permanent stock and +1 permanent potency." Only
 *                   applies when BOTH are on active slots (bench
 *                   hirelings don't participate in the action phase).
 */
function applyRoundStartAbility(
  state: ActionState,
  inst: HirelingInstance,
  atSeconds: number,
  rng: RNG
): ActionState {
  switch (inst.card.id) {
    case "goblin-king": {
      const robbin = activeHirelings(state.board).find(
        (h) => h.card.id === "robbin-goblin"
      );
      if (!robbin) return state;
      let working = buffHireling(state, inst.id, inst.id, 3, 1, atSeconds);
      working = buffHireling(working, inst.id, robbin.id, 3, 1, atSeconds);
      return working;
    }
    case "the-royal-tutor": {
      // "Choose one ally. That ally's next action gains +1 to all stat
      //  effects permanently. Cannot buff another Royal Tutor." MVP
      //  picks a random eligible ally (not self, not another Royal
      //  Tutor, not Dusty Broom) and applies +1/+1 permanent.
      const candidates = activeHirelings(state.board).filter(
        (h) =>
          h.id !== inst.id &&
          h.card.id !== "the-royal-tutor" &&
          h.card.id !== "dusty-broom"
      );
      if (candidates.length === 0) return state;
      const target = candidates[Math.floor(rng() * candidates.length)];
      return buffHireling(state, inst.id, target.id, 1, 1, atSeconds);
    }
    case "the-kingmaker": {
      // "Choose one Nobles Guild ally. Potency gains through actions
      //  are doubled for that ally. (Temporary effect.)" MVP picks a
      //  random Nobles ally (not self) and sets potencyGainsDoubled
      //  = true on its action state for the round.
      const candidates = activeHirelings(state.board).filter(
        (h) =>
          h.id !== inst.id &&
          h.card.kind === "hireling" &&
          h.card.guild === "Nobles Guild"
      );
      if (candidates.length === 0) return state;
      const target = candidates[Math.floor(rng() * candidates.length)];
      const targetHs = state.hirelingStates.get(target.id);
      if (!targetHs) return state;
      const states = new Map(state.hirelingStates);
      states.set(target.id, { ...targetHs, potencyGainsDoubled: true });
      return { ...state, hirelingStates: states };
    }
    case "tower-escapee": {
      // "Reduce the cast time of a random active hireling by 1s for
      //  this round only." MVP nudges a random non-self ally's
      //  nextCastIn down by 1s (clamped at 0.1s) at round start.
      const candidates = activeHirelings(state.board).filter(
        (h) => h.id !== inst.id
      );
      if (candidates.length === 0) return state;
      const target = candidates[Math.floor(rng() * candidates.length)];
      const targetHs = state.hirelingStates.get(target.id);
      if (!targetHs || targetHs.nextCastIn === null) return state;
      const states = new Map(state.hirelingStates);
      states.set(target.id, {
        ...targetHs,
        nextCastIn: Math.max(0.1, targetHs.nextCastIn - 1),
      });
      return { ...state, hirelingStates: states };
    }
    case "the-muffin-man": {
      // "Allies with Quickcraft gain +2 Quickcraft (permanent)." At
      //  round start, every active ally with the Quickcraft keyword
      //  gets bonusQuickcraftPerCast += 2 for the entire round.
      const states = new Map(state.hirelingStates);
      let dirty = false;
      for (const ally of activeHirelings(state.board)) {
        if (ally.id === inst.id) continue;
        if (quickcraftCount(ally) <= 0) continue;
        const allyHs = states.get(ally.id);
        if (!allyHs) continue;
        states.set(ally.id, {
          ...allyHs,
          bonusQuickcraftPerCast: allyHs.bonusQuickcraftPerCast + 2,
        });
        dirty = true;
      }
      return dirty ? { ...state, hirelingStates: states } : state;
    }
    case "batter-boy": {
      // "Each time an opponent sabotages you this round, gain +3
      //  temporary stock." Engine doesn't simulate opponent casts, so
      //  MVP: count the opponent's active Sabotage hirelings ONCE at
      //  round start and grant Batter Boy +3 temp stock per opponent
      //  saboteur (one-shot, approximating "each time over the round").
      if (!state.opponent) return state;
      const oppSaboteurs = activeHirelings(state.opponent.board).filter((h) =>
        h.card.keywords.some((k) => k.name === "Sabotage")
      ).length;
      if (oppSaboteurs === 0) return state;
      return addTemporaryStock(state, inst.id, 3 * oppSaboteurs);
    }
    case "frosted-lookout": {
      // "When an opponent uses Sabotage, immediately trigger your
      //  highest potency Sugar Guild ally's ability." MVP: at round
      //  start, if the opponent has ANY Sabotage hireling on an active
      //  slot, fire the player's highest-pot Sugar ally's
      //  applyPostCastAbility once. Approximates the "each time"
      //  reactive without simulating opponent casts.
      if (!state.opponent) return state;
      const oppHasSaboteur = activeHirelings(state.opponent.board).some((h) =>
        h.card.keywords.some((k) => k.name === "Sabotage")
      );
      if (!oppHasSaboteur) return state;
      const sugarAllies = activeHirelings(state.board).filter(
        (h) =>
          h.id !== inst.id &&
          h.card.kind === "hireling" &&
          h.card.guild === "Sugar Guild"
      );
      if (sugarAllies.length === 0) return state;
      let best = sugarAllies[0];
      let bestPot = -Infinity;
      for (const h of sugarAllies) {
        const hs = state.hirelingStates.get(h.id);
        if (!hs) continue;
        const pot = effectivePotency(h, hs, 0);
        if (pot > bestPot) { best = h; bestPot = pot; }
      }
      return applyPostCastAbility(state, best, atSeconds, rng);
    }
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
    case "pantry-stocker":
      // "+1 stock each round." Passive — fires unconditionally at the
      // end of every action round this hireling is on an active slot.
      return buffHireling(state, inst.id, inst.id, 1, 0, atSeconds);
    case "royal-treasurer": {
      // "At the end of each action round, gain +1 gold for each Noble
      // ally that sold at least once last round." Counts distinct Noble
      // allies with unitsSoldThisRound > 0 (excluding self — Royal
      // Treasurer is Passive, never sells).
      let soldNobles = 0;
      for (const ally of activeHirelings(state.board)) {
        if (ally.id === inst.id) continue;
        if (ally.card.kind !== "hireling") continue;
        if (ally.card.guild !== "Nobles Guild") continue;
        const aHs = state.hirelingStates.get(ally.id);
        if (aHs && aHs.unitsSoldThisRound > 0) soldNobles++;
      }
      if (soldNobles <= 0) return state;
      return { ...state, gold: state.gold + soldNobles };
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
/**
 * Focus-axis fill granted to the player side per customer targeted by
 * a Bewitch cast. 40 is substantial (40% of the axis) but not an auto-
 * win — another side can still contest quality/budget/type.
 */
export const BEWITCH_FOCUS_BURST = 40;

/**
 * Per-hireling Bewitch cap. The keyword spec ("max 2 at a time") means
 * a single cast can target at most 2 customers, reached only after the
 * hireling has already sold to a previously-Bewitched customer.
 */
export const MAX_BEWITCH_LEVEL = 2;

/**
 * Default seconds added to an opponent hireling's next cast on a
 * keyword Sabotage cast. Cards can override via `Sabotage xN` (e.g.
 * The Saboteur's Sabotage x2 → +2s).
 */
export const SABOTAGE_DEFAULT_SECONDS = 1;

/**
 * Resolve a numeric value from the Sabotage keyword's count. Default
 * (count not specified) → SABOTAGE_DEFAULT_SECONDS.
 */
function sabotageSecondsFor(inst: HirelingInstance): number {
  const k = inst.card.keywords.find((x) => x.name === "Sabotage");
  if (!k) return 0;
  return k.count ?? SABOTAGE_DEFAULT_SECONDS;
}

/**
 * Pick which opponent hireling this caster should sabotage. Default =
 * a random ACTIVE-slot opponent hireling. Some cards override via the
 * card.id switch:
 *
 *   - sticky-fingers: "opponent's lowest cast time hireling" — picks
 *     the active opponent with the smallest base seconds (Passive →
 *     skipped; decreasing → start value; random → max).
 *
 * Returns null when the opponent board has no active hirelings.
 */
function pickSabotageTarget(
  state: ActionState,
  caster: HirelingInstance,
  rng: RNG
): HirelingInstance | null {
  if (!state.opponent) return null;
  const candidates = activeHirelings(state.opponent.board);
  if (candidates.length === 0) return null;
  switch (caster.card.id) {
    case "sticky-fingers": {
      let best: HirelingInstance | null = null;
      let bestSeconds = Infinity;
      for (const h of candidates) {
        const seconds = castTimeForTargeting(h);
        if (seconds < bestSeconds) {
          best = h;
          bestSeconds = seconds;
        }
      }
      return best;
    }
    default:
      return candidates[Math.floor(rng() * candidates.length)];
  }
}

/**
 * Find the opponent's highest-potency active-slot hireling. Used by
 * Prince of Thieves's per-cast curse and any future "highest-pot"
 * targeting picker. Compares on the card's printed slot-0 potency
 * (no live-buff lookup since we don't simulate opponent buffs).
 * Returns null when the opponent has no active hirelings.
 */
function pickHighestPotencyOpponent(
  state: ActionState
): HirelingInstance | null {
  if (!state.opponent) return null;
  const candidates = activeHirelings(state.opponent.board);
  if (candidates.length === 0) return null;
  let best: HirelingInstance | null = null;
  let bestPot = -Infinity;
  for (const h of candidates) {
    const pot = (h.card.potions[0]?.potency ?? 0) + h.permanentPotencyBonus;
    if (pot > bestPot) {
      best = h;
      bestPot = pot;
    }
  }
  return best;
}

/**
 * Convert a card's CastTime variant into a single seconds value used
 * for target-picking decisions. Passive → Infinity (so it sorts last
 * for "lowest cast time" pickers). Decreasing → its starting value.
 * Random → its max (worst-case so we don't favor random-cast cards
 * unfairly when picking "lowest").
 */
function castTimeForTargeting(inst: HirelingInstance): number {
  const ct = inst.card.castTime;
  switch (ct.kind) {
    case "passive": return Infinity;
    case "seconds": return ct.value;
    case "decreasing": return ct.start;
    case "random": return ct.max;
  }
}

/**
 * Apply a Sabotage cast: pick an opponent hireling per card policy and
 * emit a `sabotage` log entry recording the +N seconds. The engine
 * itself doesn't simulate opponent casts (the opponent is a passive
 * snapshot whose contributions come from `computePassiveContribution`),
 * so the slowdown is consumed by the UI's visual `pcOppAction` to
 * extend the opponent's on-screen cast bar. Phase-4 reactives (Snitch
 * Witch, The Saboteur's per-success Thieves buff) listen for these
 * log entries.
 */
function applySabotage(
  state: ActionState,
  caster: HirelingInstance,
  atSeconds: number,
  rng: RNG
): ActionState {
  const seconds = sabotageSecondsFor(caster);
  if (seconds <= 0) return state;
  const target = pickSabotageTarget(state, caster, rng);
  if (!target) return state;
  let working: ActionState = {
    ...state,
    log: [
      ...state.log,
      {
        kind: "sabotage",
        casterId: caster.id,
        targetInstanceId: target.id,
        secondsAdded: seconds,
        atSeconds,
      },
    ],
  };
  // Reactive hook: every other active ally fires their on-ally-sabotage
  // ability (Snitch Witch +1 perm stock once per round).
  for (const ally of activeHirelings(working.board)) {
    if (ally.id === caster.id) continue;
    working = applyOnAllySabotageAbility(working, ally, caster, atSeconds);
  }
  // The caster's own on-Sabotage-success hook runs last (e.g. The
  // Saboteur trims 0.5s off every Thieves ally's nextCastIn).
  working = applyOnOwnSabotageSuccess(working, caster, atSeconds);
  return working;
}

/**
 * Per-card reactive hook fired for every OTHER active ally each time
 * any hireling fires Sabotage. Lets cards listen for "ally used
 * Sabotage" events.
 *
 *   - snitch-witch: "Once per round, when an ally uses Sabotage,
 *                    gain +1 permanent stock." Tracks the once-per-
 *                    round constraint by counting prior ability-buff
 *                    log entries from this Snitch Witch this round.
 */
function applyOnAllySabotageAbility(
  state: ActionState,
  reactor: HirelingInstance,
  saboteur: HirelingInstance,
  atSeconds: number
): ActionState {
  switch (reactor.card.id) {
    case "snitch-witch": {
      const alreadyTriggered = state.log.some(
        (e) =>
          e.kind === "ability-buff" &&
          e.casterId === reactor.id &&
          e.targetId === reactor.id &&
          e.stockGained === 1 &&
          e.potencyGained === 0
      );
      if (alreadyTriggered) return state;
      return buffHireling(state, reactor.id, reactor.id, 1, 0, atSeconds);
    }
    default:
      return state;
  }
}

/**
 * Per-card hook fired after the caster's OWN Sabotage successfully
 * lands. Used by self-reinforcing cards that listen for their own
 * Sabotage events.
 *
 *   - the-saboteur: "Each time this Sabotages successfully this
 *                    round, all Thieves allies gain +0.5s cast time
 *                    reduction until end of round." Implemented as
 *                    an immediate -0.5s nudge to every Thieves ally's
 *                    nextCastIn (clamped at 0.1s minimum). Long-term
 *                    reduction across multiple casts isn't tracked —
 *                    each ally's NEXT cast accelerates per Saboteur
 *                    cast that lands.
 */
function applyOnOwnSabotageSuccess(
  state: ActionState,
  caster: HirelingInstance,
  atSeconds: number
): ActionState {
  switch (caster.card.id) {
    case "the-saboteur": {
      const states = new Map(state.hirelingStates);
      let dirty = false;
      for (const ally of activeHirelings(state.board)) {
        if (ally.id === caster.id) continue; // exclude self — "Thieves allies" = others
        if (ally.card.guild !== "Thieves Guild") continue;
        const hs = state.hirelingStates.get(ally.id);
        if (!hs || hs.nextCastIn === null) continue;
        states.set(ally.id, {
          ...hs,
          nextCastIn: Math.max(0.1, hs.nextCastIn - 0.5),
        });
        dirty = true;
      }
      return dirty ? { ...state, hirelingStates: states } : state;
    }
    default:
      return state;
  }
}

/**
 * Per-card Bewitch target picker. Default = first N unresolved
 * customers this caster hasn't already tagged. Some cards override:
 *
 *   - champion-knight / the-prince: "Bewitch the highest reputation
 *     customer only." → pick the unresolved customer with the highest
 *     reputationStars (ties broken by first-seen order).
 */
function pickBewitchTargets(
  state: ActionState,
  caster: HirelingInstance,
  level: number
): CustomerState[] {
  const eligible = state.customers.filter(
    (cs) => cs.resolvedFor === null && !cs.bewitchedByIds.includes(caster.id)
  );
  switch (caster.card.id) {
    case "the-champion-knight":
    case "the-prince": {
      // Highest-rep customer only; per-card text says "only", so cap at 1.
      let best: CustomerState | null = null;
      for (const cs of eligible) {
        if (!best || cs.customer.reputationStars > best.customer.reputationStars) {
          best = cs;
        }
      }
      return best ? [best] : [];
    }
    default:
      return eligible.slice(0, level);
  }
}

/**
 * Apply a Bewitch cast: pick targets via the per-card picker, push
 * their focus axis +BEWITCH_FOCUS_BURST toward the player, and tag
 * them with this caster's id. Emits a "bewitch" log entry. Then fires
 * the per-card on-own-Bewitch-success hook for cards whose ability
 * triggers when the Bewitch lands (Lady's Maid, Knight Errant,
 * Part-Time Potioneer, Squire).
 */
function applyBewitch(
  state: ActionState,
  caster: HirelingInstance,
  atSeconds: number,
  rng: RNG
): ActionState {
  const casterHs = state.hirelingStates.get(caster.id);
  if (!casterHs) return state;
  const level = Math.min(MAX_BEWITCH_LEVEL, casterHs.bewitchLevel ?? 1);
  const targets = pickBewitchTargets(state, caster, level);
  if (targets.length === 0) return state;

  const targetIdSet = new Set(targets.map((cs) => cs.customer.id));
  const customers = state.customers.map((cs) => {
    if (!targetIdSet.has(cs.customer.id)) return cs;
    const focus = cs.axes.focus;
    const nextFocus = {
      playerFill: Math.min(
        AXIS_THRESHOLD,
        focus.playerFill + BEWITCH_FOCUS_BURST
      ),
      opponentFill: focus.opponentFill,
    };
    return {
      ...cs,
      axes: { ...cs.axes, focus: nextFocus },
      bewitchedByIds: [...cs.bewitchedByIds, caster.id],
    };
  });
  const log: ActionLogEntry[] = [
    ...state.log,
    {
      kind: "bewitch",
      casterId: caster.id,
      customerIds: targets.map((cs) => cs.customer.id),
      focusBurst: BEWITCH_FOCUS_BURST,
      atSeconds,
    },
  ];
  let working: ActionState = { ...state, customers, log };
  // Per-card on-own-Bewitch-success reactive hook.
  working = applyOnOwnBewitchSuccess(working, caster, targets, atSeconds, rng);
  return working;
}

/**
 * Per-card hook fired after this hireling's own Bewitch successfully
 * tags ≥1 customer. Can read the targeted customer(s) for conditional
 * effects (e.g. Knight Errant's "if 3+ stars").
 *
 *   - lady-s-maid:           random ally +1 permanent potency.
 *   - knight-errant:         self +3 permanent potency if any tagged
 *                            customer has >= 3 reputation stars.
 *   - part-time-potioneer:   self +2 permanent potency.
 *   - the-squire:            if a Knight Errant is on an active slot
 *                            (spec: "adjacent" — relaxed to "anywhere
 *                            on the active row" for now), copy the
 *                            Knight Errant action: +3 self pot if a
 *                            tagged customer has 3+ stars.
 */
function applyOnOwnBewitchSuccess(
  state: ActionState,
  caster: HirelingInstance,
  targets: readonly CustomerState[],
  atSeconds: number,
  rng: RNG
): ActionState {
  switch (caster.card.id) {
    case "ladys-maid": {
      const allies = activeHirelings(state.board).filter(
        (h) => h.id !== caster.id && h.card.id !== "dusty-broom"
      );
      if (allies.length === 0) return state;
      const ally = allies[Math.floor(rng() * allies.length)];
      return buffHireling(state, caster.id, ally.id, 0, 1, atSeconds);
    }
    case "knight-errant": {
      const high = targets.find((cs) => cs.customer.reputationStars >= 3);
      if (!high) return state;
      return buffHireling(state, caster.id, caster.id, 0, 3, atSeconds);
    }
    case "part-time-potioneer":
      return buffHireling(state, caster.id, caster.id, 0, 2, atSeconds);
    case "the-squire": {
      const knightOnBoard = activeHirelings(state.board).some(
        (h) => h.card.id === "knight-errant"
      );
      if (!knightOnBoard) return state;
      const high = targets.find((cs) => cs.customer.reputationStars >= 3);
      if (!high) return state;
      return buffHireling(state, caster.id, caster.id, 0, 3, atSeconds);
    }
    default:
      return state;
  }
}

/**
 * Per-bewitcher hook fired inside executeSale once a Bewitched
 * customer's sale commits. Runs ONCE per bewitcher in the customer's
 * `bewitchedByIds` list. The seller may or may not be the bewitcher.
 *
 *   - champion-knight: all Nobles Guild allies +2 permanent potency.
 *   - the-prince:      self +3 permanent potency, all Nobles allies
 *                      +1 permanent potency.
 *   - masked-minstrel: gain +3 permanent stock INSTEAD of gold (gold
 *                      from this sale is reversed).
 */
function applyOnBewitchedCustomerSale(
  state: ActionState,
  bewitcher: HirelingInstance,
  seller: HirelingInstance,
  goldFromThisSale: number,
  atSeconds: number
): ActionState {
  switch (bewitcher.card.id) {
    case "the-champion-knight":
      return buffActiveAllies(state, bewitcher, 0, 2, atSeconds, (h) =>
        h.card.kind === "hireling" && h.card.guild === "Nobles Guild"
      );
    case "the-prince": {
      let working = buffHireling(state, bewitcher.id, bewitcher.id, 0, 3, atSeconds);
      working = buffActiveAllies(working, bewitcher, 0, 1, atSeconds, (h) =>
        h.card.kind === "hireling" && h.card.guild === "Nobles Guild"
      );
      return working;
    }
    case "masked-minstrel": {
      // "gain +3 permanent stock instead of gold" — only fires when
      // Masked Minstrel itself is the seller (otherwise the customer
      // bewitched by the minstrel might be sold to by some OTHER
      // hireling; the spec ties the swap to the minstrel's own sale).
      if (seller.id !== bewitcher.id) return state;
      const reversed: ActionState = { ...state, gold: state.gold - goldFromThisSale };
      return buffHireling(reversed, bewitcher.id, bewitcher.id, 3, 0, atSeconds);
    }
    default:
      return state;
  }
}

function applyPostCastAbility(
  state: ActionState,
  caster: HirelingInstance,
  atSeconds: number,
  rng: RNG
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
    case "sticky-fingers":
      // "Knockoff x2. Sabotage opponent's lowest cast time hireling.
      //  Gain +2 temporary stock." The Sabotage portion is handled by
      //  the Sabotage keyword via applySabotage (target picker keys
      //  off card.id "sticky-fingers" to pick lowest-cast opponent).
      //  This case wires only the +2 temp stock on the caster.
      return addTemporaryStock(state, caster.id, 2);
    case "the-court-scribe": {
      // "The last permanent buff any ally gained this round is
      //  increased by +1 permanently." Walk the log for the most
      //  recent ability-buff entry; if found, apply +1 of the same
      //  stat (stock OR potency, matching whichever was non-zero).
      const last = findLastAbilityBuff(state.log);
      if (!last) return state;
      const stockBoost = last.stockGained > 0 ? 1 : 0;
      const potencyBoost = last.potencyGained > 0 ? 1 : 0;
      if (stockBoost === 0 && potencyBoost === 0) return state;
      return buffHireling(state, caster.id, last.targetId, stockBoost, potencyBoost, atSeconds, true);
    }
    case "the-grand-vizier": {
      // "Copy the last permanent buff any ally received and apply it
      //  to himself." Re-emit the same buff with Vizier as the target.
      const last = findLastAbilityBuff(state.log);
      if (!last) return state;
      return buffHireling(state, caster.id, caster.id, last.stockGained, last.potencyGained, atSeconds, true);
    }
    case "robbin-goblin": {
      // "Knockoff x1. If potency is below 5, steal +1 permanent stock
      //  from opponent's lowest potency hireling." We don't mutate
      //  opponent state (snapshot), so the steal manifests as a self
      //  +1 permanent stock when conditions are met:
      //    - Robbin's effective potency on EITHER slot < 5
      //      (dual-potion cards: lowest of the two potencies counts).
      //    - Opponent has at least one active hireling.
      const hs = state.hirelingStates.get(caster.id);
      if (!hs) return state;
      const pot0 = effectivePotency(caster, hs, 0);
      const pot1 = caster.potionType2 !== null ? effectivePotency(caster, hs, 1) : Infinity;
      if (Math.min(pot0, pot1) >= 5) return state;
      if (!state.opponent) return state;
      if (activeHirelings(state.opponent.board).length === 0) return state;
      return buffHireling(state, caster.id, caster.id, 1, 0, atSeconds, true);
    }
    case "puss-in-boots": {
      // "Knockoff x5. Haggle. Steal 1 Reputation star from each
      //  customer (they must have more than 1 reputation star). Gain
      //  +1 permanent stock per star stolen." Per cast, modify every
      //  unresolved customer with reputationStars > 1 (drop by 1) and
      //  grant Puss +1 perm stock per star stolen.
      let stolen = 0;
      const customers = state.customers.map((cs) => {
        if (cs.resolvedFor !== null) return cs;
        if (cs.customer.reputationStars <= 1) return cs;
        stolen++;
        return {
          ...cs,
          customer: {
            ...cs.customer,
            reputationStars: cs.customer.reputationStars - 1,
          },
        };
      });
      if (stolen === 0) return state;
      let working: ActionState = { ...state, customers };
      working = buffHireling(working, caster.id, caster.id, stolen, 0, atSeconds, true);
      return working;
    }
    // The Muffin Man's "+2 Quickcraft permanent" applies at round
    // start so it benefits every cast of every Quickcraft ally that
    // round (otherwise per-Muffin-Man-cast bumps fire after most
    // allies have already cast in tick-iteration order). Wired in
    // applyRoundStartAbility instead of here.
    case "the-grand-thief": {
      // "Knockoff x5. For each Thieves ally with Knockoff, gain +2
      //  temporary stock. All Thieves allies trigger Knockoff x1
      //  immediately." Two clauses:
      //    1. count Thieves allies (excl. self) with Knockoff → grant
      //       Grand Thief +2 temp stock per.
      //    2. for each Thieves ally with Knockoff (incl. self?), if
      //       potency < 10, grant +1 perm stock (mimics Knockoff).
      const knockoffThieves = activeHirelings(state.board).filter(
        (h) => h.card.guild === "Thieves Guild" && knockoffCount(h) > 0
      );
      let working = state;
      const otherCount = knockoffThieves.filter((h) => h.id !== caster.id).length;
      if (otherCount > 0) {
        working = addTemporaryStock(working, caster.id, otherCount * 2);
      }
      for (const ally of knockoffThieves) {
        if (ally.id === caster.id) continue; // "all Thieves allies" = others
        const allyHs = working.hirelingStates.get(ally.id);
        if (!allyHs) continue;
        if (effectivePotency(ally, allyHs, 0) >= 10) continue;
        working = buffHireling(working, caster.id, ally.id, 1, 0, atSeconds, true);
      }
      return working;
    }
    case "sugar-rush-peddler": {
      // "Quickcraft x4. Each sale this round reduces cast time by 0.5s
      //  until end of round." Per-cast: nudge own nextCastIn by -0.5s
      //  per sale fired so far this round (one-shot reduction at
      //  cast time, not a sticky reduction across all future casts).
      //  Spec literally says "until end of round" but tracking a
      //  per-card cast-time-delta accumulator across reschedules is
      //  out of scope; this captures the flavor without the
      //  bookkeeping.
      // Count THIS hireling's own sales (spec: "Each sale this round
      // reduces cast time" — read as Peddler's own sales, not the
      // whole board's). hs.unitsSoldThisRound treats batched sales
      // as sales of N units; for the cast-time reduction we want
      // sale-events, not units, so filter the log by instanceId.
      const sales = state.log.filter(
        (e) => e.kind === "sale" && e.instanceId === caster.id
      ).length;
      if (sales === 0) return state;
      const reduction = sales * 0.5;
      const hs = state.hirelingStates.get(caster.id);
      if (!hs || hs.nextCastIn === null) return state;
      const states = new Map(state.hirelingStates);
      states.set(caster.id, {
        ...hs,
        nextCastIn: Math.max(0.1, hs.nextCastIn - reduction),
      });
      return { ...state, hirelingStates: states };
    }
    case "royal-advisor": {
      // "Sabotage an ally. If it is a Nobles Guild ally, that ally's
      //  next action gains +2 to all stat effects permanently."
      //  Royal Advisor's keyword Sabotage already fires (random
      //  opponent target). This case adds the per-card buff: pick a
      //  Nobles Guild ally on the active row at random and grant +2
      //  permanent stock + +2 permanent potency. ("Next action gains
      //  +2 to all stat effects permanently" relaxed to +2/+2
      //  permanent, since per-cast next-action gating would need a
      //  whole new track.)
      const nobleAllies = activeHirelings(state.board).filter(
        (h) => h.id !== caster.id && h.card.guild === "Nobles Guild"
      );
      if (nobleAllies.length === 0) return state;
      const target = nobleAllies[Math.floor(rng() * nobleAllies.length)];
      return buffHireling(state, caster.id, target.id, 2, 2, atSeconds);
    }
    case "prince-of-thieves": {
      // "Knockoff x4. Spend -2 Reputation. Curse opponent's highest
      //  potency hireling — it adds 3 seconds to their current cast."
      //  Implemented as a per-card sabotage (no Sabotage keyword on
      //  the card): emit a sabotage log entry against the opponent's
      //  highest-potency active hireling, with secondsAdded = 3, plus
      //  the −2 reputation cost.
      let working: ActionState = { ...state, reputation: state.reputation - 2 };
      const target = pickHighestPotencyOpponent(working);
      if (!target) return working;
      const log: ActionLogEntry[] = [
        ...working.log,
        {
          kind: "sabotage",
          casterId: caster.id,
          targetInstanceId: target.id,
          secondsAdded: 3,
          atSeconds,
        },
      ];
      return { ...working, log };
    }
    case "the-herald": {
      // "All Nobles Guild allies gain +1 temporary stock." (Per cast.)
      let working = state;
      for (const ally of activeHirelings(state.board)) {
        if (ally.id === caster.id) continue;
        if (ally.card.kind !== "hireling") continue;
        if (ally.card.guild !== "Nobles Guild") continue;
        working = addTemporaryStock(working, ally.id, 1);
      }
      return working;
    }
    case "grumblegut-dragon":
      // "Eat +2 potency permanently from each adjacent hireling. Gain
      //  +1 permanent stock per potency eaten." Skips Dusty Broom
      //  ("Cannot be buffed.") and caps eaten at the neighbor's current
      //  effective potency (can't eat more than they have).
      return applyGrumbleguDragonCast(state, caster, atSeconds);
    case "the-queen": {
      // "Bewitch. Grant all customers currently in the middle zone +1
      //  reputation." Middle zone = all currently-unresolved customers
      //  (per user clarification). Each cast adds +1 rep star per
      //  customer, which the player earns when selling to them.
      const customers = state.customers.map((cs) => {
        if (cs.resolvedFor !== null) return cs;
        return {
          ...cs,
          customer: {
            ...cs.customer,
            reputationStars: cs.customer.reputationStars + 1,
          },
        };
      });
      return { ...state, customers };
    }
    default:
      return state;
  }
}

/** Grumblegut Dragon: devour adjacent active allies' potency permanently. */
function applyGrumbleguDragonCast(
  state: ActionState,
  caster: HirelingInstance,
  atSeconds: number
): ActionState {
  const casterSlot = state.board.slots.findIndex((s) => s?.id === caster.id);
  if (casterSlot === -1) return state;
  let working = state;
  let totalEaten = 0;
  for (const neighborSlot of [casterSlot - 1, casterSlot + 1]) {
    if (neighborSlot < 0 || neighborSlot >= state.board.slots.length) continue;
    const neighbor = state.board.slots[neighborSlot];
    if (!neighbor) continue;
    if (!working.hirelingStates.has(neighbor.id)) continue;
    if (neighbor.card.id === "dusty-broom") continue; // Cannot be buffed.
    const hs = working.hirelingStates.get(neighbor.id)!;
    const eaten = Math.min(2, Math.max(0, effectivePotency(neighbor, hs)));
    if (eaten === 0) continue;
    working = buffHireling(working, caster.id, neighbor.id, 0, -eaten, atSeconds);
    totalEaten += eaten;
  }
  if (totalEaten > 0) {
    working = buffHireling(working, caster.id, caster.id, totalEaten, 0, atSeconds);
  }
  return working;
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

  // Quickcraft: add temp stock post-cast. The Muffin Man's per-cast
  // ability grants +2 to each Quickcraft ally's `bonusQuickcraftPerCast`
  // for the round; that bonus is added to whatever the keyword's count
  // is so Muffin Man effectively bumps allied Quickcraft by 2 per
  // Muffin Man cast.
  let temporaryStock = prev.temporaryStock;
  const qc = quickcraftCount(inst);
  if (qc > 0) {
    const totalAdded = qc + (prev.bonusQuickcraftPerCast || 0);
    temporaryStock += totalAdded;
    log.push({
      kind: "quickcraft",
      instanceId,
      atSeconds,
      stockAdded: totalAdded,
      temporaryStockAfter: temporaryStock,
    });
  }

  // Schedule the next cast, or mark stopped. Uses the board-aware
  // effective cast time so cards like Rush Order Cook honor their
  // per-ally reductions.
  const nextDelay = nextCastDelay(
    effectiveCastTime(inst, state.board, state.weather),
    castNumber,
    rng
  );
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
  let withCasterState: ActionState = {
    ...state,
    hirelingStates,
    log,
  };
  withCasterState = applyPostCastAbility(withCasterState, inst, atSeconds, rng);
  // Bewitch keyword fires after every cast of a hireling that carries
  // it — applies a focus burst to `bewitchLevel` unresolved customers
  // and tags them so a later sale can trigger the +1 bewitchLevel
  // follow-up.
  if (hasKeyword(inst, "Bewitch")) {
    withCasterState = applyBewitch(withCasterState, inst, atSeconds, rng);
  }
  // Sabotage keyword fires after every cast — picks an opponent
  // hireling (random by default; per-card policy via
  // pickSabotageTarget) and emits a `sabotage` log entry adding +N
  // seconds to that hireling's next cast. Phase-4 reactives (Snitch
  // Witch, The Saboteur's Thieves buff) listen for these.
  if (hasKeyword(inst, "Sabotage")) {
    withCasterState = applySabotage(withCasterState, inst, atSeconds, rng);
  }
  // Reactive hook for OTHER active allies (e.g. Apprentice Baker: +1
  // temp stock whenever an ally uses Quickcraft).
  for (const ally of activeHirelings(withCasterState.board)) {
    if (ally.id === inst.id) continue;
    withCasterState = applyOnAllyCastAbility(
      withCasterState,
      ally,
      inst,
      atSeconds
    );
  }
  return withCasterState;
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
    let next = resolveCustomer(cs);
    // Demote bogus player wins (no seller on the board) to no-sale.
    if (next.resolvedFor === "player") {
      const seller = pickSalesHireling(working, next.customer.desiredType);
      if (!seller) {
        next = { ...next, resolvedFor: "no-sale" };
      }
    }
    // Tasting Table redirect: same path as advanceCustomers.
    {
      const redirected = applyTastingTableRedirect(working, next);
      working = redirected.state;
      next = redirected.customerState;
    }
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
    } else {
      for (const ally of activeHirelings(working.board)) {
        working = applyOnNoPlayerSaleAbility(working, ally, state.elapsedSeconds, next.customer);
      }
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
    // Weather modifiers applied to player passive contributions.
    const w = state.weather?.effect;
    const playerPassiveMul = w?.playerPassiveMultiplier ?? 1;
    const qualityMul = w?.qualityMultiplier ?? 1;
    for (const h of hirelings) {
      const price =
        (h.potionType && priceByType.get(h.potionType)) ?? MIN_PRICE;
      const contrib = computePassiveContribution(h, price, next.customer);
      for (const axis of AXES) {
        let amount = contrib[axis] * activeDt * playerPassiveMul;
        if (axis === "quality") amount *= qualityMul;
        if (amount > 0) {
          next = applyContribution(next, axis, "player", amount);
        }
      }
    }
    // Weather: rain-style focus boost on the customer's matching type.
    if (w?.focusBoostPerSecond) {
      const fb = w.focusBoostPerSecond;
      const matches = !fb.potionType || fb.potionType === next.customer.desiredType;
      if (matches) {
        next = applyContribution(next, "focus", fb.side, fb.amount * activeDt);
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

    // Early-resolution: once one side holds a decisive weighted lead
    // (>= EARLY_RESOLVE_MIN_DIFF, i.e. at least half the 10-point max),
    // the customer commits now instead of standing around for the rest
    // of their patience. Without this, Dusty Broom with its base stock
    // of 5 couldn't visibly sell until patience expiry even when it
    // had already passively locked in all 4 axes.
    if (next.resolvedFor === null && !isExpired(next)) {
      const earlyWinner = determineEarlyWinner(next);
      if (earlyWinner === "player") {
        // Only early-resolve a player win if a seller actually exists;
        // otherwise fall back to patience expiry (and the expiry path's
        // demote-to-no-sale guard).
        const seller = pickSalesHireling(working, next.customer.desiredType);
        if (seller) next = { ...next, resolvedFor: "player" };
      } else if (earlyWinner === "opponent") {
        next = { ...next, resolvedFor: "opponent" };
      }
    }

    if (isExpired(next) || next.resolvedFor !== null) {
      if (next.resolvedFor === null) next = resolveCustomer(next);
      // If the axes declared a player win but no hireling can actually
      // fulfill (no matching potion type on the board, or the only
      // matching hireling is out of stock), demote to "no-sale".
      // Otherwise the UI happily shows "✓ Won" without any gold/stock
      // change — the sale never really happened.
      if (next.resolvedFor === "player") {
        const seller = pickSalesHireling(working, next.customer.desiredType);
        if (!seller) {
          next = { ...next, resolvedFor: "no-sale" };
        }
      }
      // Tasting Table redirect: see applyTastingTableRedirect.
      const redirected = applyTastingTableRedirect(working, next);
      working = redirected.state;
      next = redirected.customerState;
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
      } else {
        // Non-player resolution → fire reactive hooks (e.g. Nimble Ned
        // pickpockets +1 gold from a walk-away).
        for (const ally of activeHirelings(working.board)) {
          working = applyOnNoPlayerSaleAbility(working, ally, state.elapsedSeconds, next.customer);
        }
      }
    }
    customersAfter.push(next);
  }

  return { ...working, customers: customersAfter };
}

/**
 * Pick the hireling + slot that rings up this customer: among active
 * hirelings whose primary OR secondary potion matches the customer's
 * desired type AND carries at least one unit of effective stock,
 * choose the highest effective potency. Ties broken by active-slot
 * order. Returns null when nobody can sell.
 *
 * The returned tuple includes the matched slot index so executeSale
 * knows which slot's tracker to debit (units sold, Knockoff bonus).
 */
function pickSalesHirelingWithSlot(
  state: ActionState,
  desiredType: string
): { hireling: HirelingInstance; slot: 0 | 1 } | null {
  let best: { hireling: HirelingInstance; slot: 0 | 1 } | null = null;
  let bestPotency = -1;
  for (const h of activeHirelings(state.board)) {
    const hs = state.hirelingStates.get(h.id);
    if (!hs) continue;
    for (const slot of [0, 1] as const) {
      const matches = slot === 0 ? h.potionType === desiredType : h.potionType2 === desiredType;
      if (!matches) continue;
      if (effectiveStock(h, hs, slot) <= 0) continue;
      const pot = effectivePotency(h, hs, slot);
      if (pot > bestPotency) {
        best = { hireling: h, slot };
        bestPotency = pot;
      }
    }
  }
  return best;
}

/**
 * Backwards-compatible variant — returns just the hireling, dropping
 * the slot. Used by the demote-bogus-player-win check that doesn't
 * care which slot would have served.
 */
function pickSalesHireling(
  state: ActionState,
  desiredType: string
): HirelingInstance | null {
  return pickSalesHirelingWithSlot(state, desiredType)?.hireling ?? null;
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
  const picked = pickSalesHirelingWithSlot(state, customerState.customer.desiredType);
  if (!picked) return state; // Nothing to sell — resolve stands, no gold/rep.
  const hireling = picked.hireling;
  const slot = picked.slot;

  const hs = state.hirelingStates.get(hireling.id)!;
  const available = effectiveStock(hireling, hs, slot);
  const desired = customerState.customer.desiredUnits ?? 1;
  const rolled = rollUnitsPerInteraction(available, rng);
  // Customer buys at least their desiredUnits (if stock allows), and up
  // to whatever the stock bracket rolls on top of that. Lets customer
  // demand scale with round without ignoring stock brackets.
  const units = Math.min(available, Math.max(desired, rolled));
  if (units <= 0) return state;

  // Pick the price for the SLOT'S potion type (slot 0 = potionType,
  // slot 1 = potionType2). Both are players-set, but each slot can be
  // a different active type.
  const slotPotionType = slot === 0 ? hireling.potionType : hireling.potionType2;
  const basePrice = priceByType.get(slotPotionType!) ?? MIN_PRICE;
  const haggled = hasKeyword(hireling, "Haggle");
  const pricePerUnit = applyHaggle(basePrice, hireling);
  const goldEarned = units * pricePerUnit;
  // Crooked Confessor: "all ally Haggle sales no longer cost Reputation."
  // Waives the -1 haggle penalty whenever a Crooked Confessor is on any
  // active slot on the player's board.
  const confessorOnBoard = activeHirelings(state.board).some(
    (h) => h.card.id === "crooked-confessor"
  );
  const haggleRepPenalty = haggled && !confessorOnBoard ? 1 : 0;
  const reputationDelta =
    customerState.customer.reputationStars - haggleRepPenalty;

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

  // Update hireling action state: consume stock from the matched slot.
  let nextHs: HirelingActionState = slot === 0
    ? { ...hs, unitsSoldThisRound: hs.unitsSoldThisRound + units }
    : { ...hs, unitsSoldThisRound2: hs.unitsSoldThisRound2 + units };

  // Knockoff: after sell, if current potency < 10, gain +N permanent
  // stock on the SLOT that just sold.
  const knockoff = knockoffCount(hireling);
  if (knockoff > 0 && effectivePotency(hireling, hs, slot) < 10) {
    nextHs = slot === 0
      ? { ...nextHs, permanentStockGainedThisRound: nextHs.permanentStockGainedThisRound + knockoff }
      : { ...nextHs, permanentStockGainedThisRound2: nextHs.permanentStockGainedThisRound2 + knockoff };
    log.push({
      kind: "knockoff",
      instanceId: hireling.id,
      stockGained: knockoff,
      atSeconds: state.elapsedSeconds,
    });
  }

  // Bewitch follow-up: if THIS hireling previously Bewitched THIS
  // customer and this is the sale, bump its bewitchLevel (capped at
  // MAX_BEWITCH_LEVEL). Per keyword spec: "After this sells to a
  // Bewitched customer, its next Bewitch affects an additional
  // customer simultaneously. Up to 2 at a time."
  if (
    customerState.bewitchedByIds.includes(hireling.id) &&
    nextHs.bewitchLevel < MAX_BEWITCH_LEVEL
  ) {
    nextHs = { ...nextHs, bewitchLevel: nextHs.bewitchLevel + 1 };
  }

  const hirelingStates = new Map(state.hirelingStates);
  hirelingStates.set(hireling.id, nextHs);

  // Market-Rush weather: every sale grants +N bonus gold.
  const goldBonus = state.weather?.effect.goldPerSale ?? 0;
  let working: ActionState = {
    ...state,
    hirelingStates,
    gold: state.gold + goldEarned + goldBonus,
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

  // Bewitched-customer-buy reactive: for each hireling that previously
  // Bewitched this customer, fire its on-buy effect (Champion Knight
  // / Prince / Masked Minstrel). Looks up the bewitcher in the active
  // hirelings list — bewitchers that have left the board (sold off
  // mid-round, but the board is locked, so this never happens) are
  // simply skipped.
  for (const bewitcherId of customerState.bewitchedByIds) {
    const bewitcher = activeHirelings(state.board).find((h) => h.id === bewitcherId);
    if (!bewitcher) continue;
    working = applyOnBewitchedCustomerSale(
      working,
      bewitcher,
      hireling,
      goldEarned,
      state.elapsedSeconds
    );
  }

  return working;
}
