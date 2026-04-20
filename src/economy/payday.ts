import { canAfford, SELL_VALUE } from "./gold";
import {
  currentWageDemand,
  isExemptFromPayday,
  MAX_PAYDAYS,
  WageTracker,
} from "./wages";

/** Shop rounds at which payday resolves (before the shop phase opens). */
export const PAYDAY_ROUNDS: readonly number[] = [3, 6, 9, 12, 15];

/** Rounds where the payday indicator glows/pulses as a warning. */
export const GLOW_ROUNDS: readonly number[] = [2, 5, 8, 11, 14];

/** Returns true when the given round is a payday. */
export function isPaydayRound(round: number): boolean {
  return PAYDAY_ROUNDS.includes(round);
}

/** Returns true when the given round is the glow/warning round before a payday. */
export function isGlowRound(round: number): boolean {
  return GLOW_ROUNDS.includes(round);
}

/**
 * 1-indexed payday number (1..MAX_PAYDAYS) for a payday round, or null if
 * the round is not a payday.
 */
export function paydayIndex(round: number): number | null {
  const idx = PAYDAY_ROUNDS.indexOf(round);
  return idx === -1 ? null : idx + 1;
}

/**
 * The next payday round at or after `currentRound`, or null if there are no
 * more paydays this game (e.g. asked about round 16).
 */
export function nextPaydayRound(currentRound: number): number | null {
  for (const r of PAYDAY_ROUNDS) {
    if (r >= currentRound) return r;
  }
  return null;
}

/**
 * How many rounds from `currentRound` until the next payday. 0 means this
 * round IS payday. Returns null once all paydays are behind the player.
 */
export function roundsUntilPayday(currentRound: number): number | null {
  const next = nextPaydayRound(currentRound);
  return next === null ? null : next - currentRound;
}

/**
 * A single line-item produced by resolving payday: one entry per hireling
 * on the board (including the bench; Dusty Broom is excluded via
 * isExemptFromPayday).
 */
export interface PaydayLineItem {
  tracker: WageTracker;
  /** Wage this hireling currently demands. */
  wage: number;
  /** Whether the player has enough gold to Pay this hireling. */
  canPay: boolean;
  /** Gold the player would get back if they Sell instead. */
  sellValue: number;
}

/**
 * Produce a payday line item for every non-exempt tracker. The UI presents
 * these so the player chooses Pay or Sell per hireling. `canPay` reflects
 * the player's gold at evaluation time — as gold is spent, the caller should
 * re-evaluate by calling this again (or updating line items in place).
 */
export function buildPaydayLineItems(
  gold: number,
  trackers: readonly WageTracker[]
): PaydayLineItem[] {
  return trackers
    .filter((t) => !isExemptFromPayday(t))
    .map((tracker) => {
      const wage = currentWageDemand(tracker);
      return {
        tracker,
        wage,
        canPay: canAfford(gold, wage),
        sellValue: SELL_VALUE,
      };
    });
}

/** Guards against a caller asking about paydays beyond the 15-round game. */
export function totalPaydays(): number {
  return MAX_PAYDAYS;
}
