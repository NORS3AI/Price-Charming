import { PotionTypeId } from "../potions/types";

/** The four axes of the customer tug-of-war. */
export type AxisKind = "focus" | "type" | "budget" | "quality";

/** Canonical ordering of axes. */
export const AXES: readonly AxisKind[] = Object.freeze([
  "focus",
  "type",
  "budget",
  "quality",
] as const);

/** Which side of the tug-of-war is acting. */
export type Side = "player" | "opponent";

/**
 * Terminal state of a resolved customer:
 *   - `"player"` / `"opponent"` — that side closed the sale
 *   - `"no-sale"` — patience expired with nobody leading on any axis;
 *     the customer walks away and neither side scores
 *
 * Distinguishing `"no-sale"` from the unresolved-`null` in CustomerState
 * lets `applyContribution` and `tickPatience` correctly short-circuit
 * once the customer is finalised.
 */
export type Resolution = Side | "no-sale";

/**
 * Fill required for a side to "win" a single axis. Bars live in [0, AXIS_THRESHOLD].
 * Units are abstract; Phase 7 wires the per-second rates.
 */
export const AXIS_THRESHOLD = 100;

/** Spec range for customer reputation stars. */
export const MIN_REPUTATION_STARS = 1;
export const MAX_REPUTATION_STARS = 5;

/**
 * A customer walking up to the marketplace. They carry a single desired
 * potion type, a budget, a quality threshold, patience in seconds, and a
 * priority ordering of the four axes — the first entry is the most
 * important to them and breaks ties at resolution.
 */
export interface Customer {
  id: string;
  desiredType: PotionTypeId;
  budget: number;
  qualityThreshold: number;
  reputationStars: number;
  patienceSeconds: number;
  /** Length-4 permutation of AXES, most important first. */
  axisPriority: readonly AxisKind[];
}

/** A single axis's current fill on both sides. */
export interface AxisBar {
  playerFill: number;
  opponentFill: number;
}

/** Per-customer runtime state while they're being contested. */
export interface CustomerState {
  customer: Customer;
  axes: Readonly<Record<AxisKind, AxisBar>>;
  patienceRemaining: number;
  /**
   * Null while the customer is still in play. Once finalised, one of
   * `"player"` / `"opponent"` / `"no-sale"`.
   */
  resolvedFor: Resolution | null;
}
