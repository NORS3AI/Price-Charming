import {
  AXES,
  AXIS_THRESHOLD,
  AxisBar,
  AxisKind,
  Customer,
  CustomerState,
  MAX_REPUTATION_STARS,
  MIN_REPUTATION_STARS,
  Resolution,
  Side,
} from "./types";

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number (got ${value}).`);
  }
}

/**
 * Build a fresh state for a customer: every axis at 0/0, patience at
 * customer.patienceSeconds, unresolved. Validates the customer's
 * reputation range and axis priority completeness.
 */
export function createCustomerState(customer: Customer): CustomerState {
  if (
    !Number.isInteger(customer.reputationStars) ||
    customer.reputationStars < MIN_REPUTATION_STARS ||
    customer.reputationStars > MAX_REPUTATION_STARS
  ) {
    throw new Error(
      `Customer reputationStars must be integer in ${MIN_REPUTATION_STARS}..${MAX_REPUTATION_STARS} (got ${customer.reputationStars}).`
    );
  }
  if (customer.axisPriority.length !== AXES.length) {
    throw new Error(
      `Customer axisPriority must list all ${AXES.length} axes.`
    );
  }
  if (new Set(customer.axisPriority).size !== AXES.length) {
    throw new Error("Customer axisPriority contains duplicates.");
  }
  assertFinite(customer.patienceSeconds, "Customer patienceSeconds");
  if (customer.patienceSeconds <= 0) {
    throw new Error("Customer patienceSeconds must be positive.");
  }

  const axes: Record<AxisKind, AxisBar> = {
    focus: { playerFill: 0, opponentFill: 0 },
    type: { playerFill: 0, opponentFill: 0 },
    budget: { playerFill: 0, opponentFill: 0 },
    quality: { playerFill: 0, opponentFill: 0 },
  };

  return {
    customer,
    axes,
    patienceRemaining: customer.patienceSeconds,
    resolvedFor: null,
  };
}

function setAxis(
  state: CustomerState,
  axis: AxisKind,
  bar: AxisBar
): CustomerState {
  return {
    ...state,
    axes: { ...state.axes, [axis]: bar },
  };
}

function clampToThreshold(fill: number): number {
  return Math.max(0, Math.min(AXIS_THRESHOLD, fill));
}

/**
 * Add `amount` to `side`'s fill on the given axis. Negative amounts
 * drain. Bars clamp to [0, AXIS_THRESHOLD]. Resolved customers are
 * returned unchanged — the sale is already closed.
 */
export function applyContribution(
  state: CustomerState,
  axis: AxisKind,
  side: Side,
  amount: number
): CustomerState {
  if (state.resolvedFor !== null) return state;
  assertFinite(amount, "applyContribution amount");
  const current = state.axes[axis];
  const next: AxisBar =
    side === "player"
      ? { ...current, playerFill: clampToThreshold(current.playerFill + amount) }
      : {
          ...current,
          opponentFill: clampToThreshold(current.opponentFill + amount),
        };
  return setAxis(state, axis, next);
}

/**
 * Decrement patience by `seconds`. Floors at 0. Does not auto-resolve;
 * call `resolveCustomer` when patience hits 0 or gameplay decides.
 */
export function tickPatience(
  state: CustomerState,
  seconds: number
): CustomerState {
  if (state.resolvedFor !== null) return state;
  assertFinite(seconds, "tickPatience seconds");
  if (seconds < 0) {
    throw new Error("tickPatience seconds must be non-negative.");
  }
  return {
    ...state,
    patienceRemaining: Math.max(0, state.patienceRemaining - seconds),
  };
}

/** True when the customer's patience has expired. */
export function isExpired(state: CustomerState): boolean {
  return state.patienceRemaining <= 0;
}

/**
 * Which side currently leads on this single axis — i.e. whose fill is
 * strictly greater. `null` means tied (equal fills, including both zero).
 */
export function axisLeader(
  state: CustomerState,
  axis: AxisKind
): Side | null {
  const bar = state.axes[axis];
  if (bar.playerFill > bar.opponentFill) return "player";
  if (bar.opponentFill > bar.playerFill) return "opponent";
  return null;
}

/** Number of axes where `side` is strictly ahead of the opposite side. */
export function axesLedBy(state: CustomerState, side: Side): number {
  let count = 0;
  for (const axis of AXES) {
    if (axisLeader(state, axis) === side) count++;
  }
  return count;
}

/**
 * Decide who wins the customer right now without mutating state:
 *  1. Whoever leads on more axes.
 *  2. If tied, the customer's axisPriority breaks it — the first-listed
 *     axis with a leader decides.
 *  3. If nobody leads on any axis, return null (nobody wins).
 */
export function determineWinner(state: CustomerState): Side | null {
  const playerLeads = axesLedBy(state, "player");
  const opponentLeads = axesLedBy(state, "opponent");
  if (playerLeads > opponentLeads) return "player";
  if (opponentLeads > playerLeads) return "opponent";

  for (const axis of state.customer.axisPriority) {
    const leader = axisLeader(state, axis);
    if (leader) return leader;
  }
  return null;
}

/**
 * Lock in the customer's decision. If `state.resolvedFor` is already
 * set, the state is returned unchanged. Otherwise the resolution is
 * either the winning Side or `"no-sale"` when no axis has a leader.
 * Unlike a literal null, `"no-sale"` causes subsequent contribution /
 * patience calls to no-op correctly.
 */
export function resolveCustomer(state: CustomerState): CustomerState {
  if (state.resolvedFor !== null) return state;
  const winner = determineWinner(state);
  const resolution: Resolution = winner ?? "no-sale";
  return { ...state, resolvedFor: resolution };
}

/** True once the customer's fate has been locked in (Side win or no-sale). */
export function isResolved(state: CustomerState): boolean {
  return state.resolvedFor !== null;
}

/**
 * Reputation stars to award the player. Returns `customer.reputationStars`
 * when the customer resolved for the player, otherwise 0. Opponent wins
 * and no-decision outcomes grant nothing.
 */
export function reputationReward(state: CustomerState): number {
  return state.resolvedFor === "player" ? state.customer.reputationStars : 0;
}
