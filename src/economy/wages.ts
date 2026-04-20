import { WageTier } from "../cards/types";

/** Maximum payday number reachable in a full 15-round game. */
export const MAX_PAYDAYS = 4;

/**
 * Per-tier wage demanded at each payday (1-indexed). Starter hirelings with
 * tier "None" are exempt and always demand 0g.
 */
export const WAGE_SCHEDULE: Readonly<Record<WageTier, readonly number[]>> = {
  Low: [2, 4, 6, 8, 10],
  Medium: [4, 6, 8, 10, 12],
  High: [6, 8, 10, 12, 14],
  None: [0, 0, 0, 0, 0],
};

/**
 * Per-hireling wage state. `paydaysSurvived` counts how many paydays this
 * specific hireling has already been paid through. A freshly purchased
 * hireling starts at 0 — the next payday will be their 1st.
 *
 * `lastPaidRound` records the round on which this hireling was most
 * recently paid. Used to prevent double-billing within a single payday
 * round (e.g. a hireling whose paydaysSurvived was behind the current
 * payday index could otherwise be re-included after paying once).
 *
 * Benching does not pause or reset the counter. Selling + repurchasing
 * starts a new tracker at 0 (handled by the caller — create a new tracker).
 */
export interface WageTracker {
  tier: WageTier;
  paydaysSurvived: number;
  lastPaidRound: number;
}

/** Create a fresh tracker for a hireling with the given wage tier. */
export function createWageTracker(tier: WageTier): WageTracker {
  return { tier, paydaysSurvived: 0, lastPaidRound: 0 };
}

/**
 * Wage due at the given 1-indexed payday number for this tier.
 * Throws for payday numbers outside 1..MAX_PAYDAYS.
 */
export function wageFor(tier: WageTier, paydayNumber: number): number {
  if (
    !Number.isInteger(paydayNumber) ||
    paydayNumber < 1 ||
    paydayNumber > MAX_PAYDAYS
  ) {
    throw new Error(
      `paydayNumber must be an integer in 1..${MAX_PAYDAYS} (got ${paydayNumber}).`
    );
  }
  return WAGE_SCHEDULE[tier][paydayNumber - 1];
}

/**
 * Wage the hireling will owe at their next upcoming payday — i.e. the wage
 * for their (paydaysSurvived + 1)th payday.
 */
export function currentWageDemand(tracker: WageTracker): number {
  return wageFor(tracker.tier, tracker.paydaysSurvived + 1);
}

/**
 * Return a new tracker reflecting that this hireling was paid through one
 * more payday. Original tracker is not mutated. Throws if called beyond
 * MAX_PAYDAYS (a 15-round game has exactly 5 paydays).
 */
export function survivePayday(tracker: WageTracker, round = 0): WageTracker {
  if (tracker.paydaysSurvived >= MAX_PAYDAYS) {
    throw new Error(
      `Hireling has already survived the maximum of ${MAX_PAYDAYS} paydays.`
    );
  }
  return {
    ...tracker,
    paydaysSurvived: tracker.paydaysSurvived + 1,
    lastPaidRound: round,
  };
}

/**
 * Starter hirelings (wage tier "None" — only Dusty Broom today) are exempt
 * from payday entirely and should be skipped by the payday resolution UI.
 */
export function isExemptFromPayday(tracker: WageTracker): boolean {
  return tracker.tier === "None";
}
