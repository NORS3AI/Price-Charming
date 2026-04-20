import { Board } from "../board/types";
import { Customer, CustomerState, Resolution } from "../customers/types";
import { PriceMap } from "../pricing/panel";
import { PotionTypeId } from "../potions/types";

/**
 * Per-hireling state that lives only during the action phase. Base stats
 * (stock, potency) are on the HirelingCard; permanent buffs that carry
 * across rounds live on HirelingInstance. Anything temporary — cast
 * timers, Quickcraft temp stock — lives here and resets each round.
 */
export interface HirelingActionState {
  instanceId: string;
  /** Total casts fired so far this round. */
  castsSoFar: number;
  /**
   * Seconds until the next cast fires. null means the hireling will
   * never cast again this round (passive, or a decreasing cast time
   * that hit zero).
   */
  nextCastIn: number | null;
  /** Quickcraft-generated stock this round (reverts at round end). */
  temporaryStock: number;
  /** Permanent stock gained this round (carries via HirelingInstance later). */
  permanentStockGainedThisRound: number;
  /** Permanent potency gained this round. */
  permanentPotencyGainedThisRound: number;
}

/** Structured log entries emitted by the tick loop for tests and UI. */
export type ActionLogEntry =
  | {
      kind: "cast";
      instanceId: string;
      atSeconds: number;
      castNumber: number;
    }
  | {
      kind: "quickcraft";
      instanceId: string;
      atSeconds: number;
      stockAdded: number;
      temporaryStockAfter: number;
    }
  | {
      kind: "stopped";
      instanceId: string;
      atSeconds: number;
      reason: "decreasing-zero" | "passive";
    }
  | {
      kind: "customer-arrived";
      customerId: string;
      atSeconds: number;
    }
  | {
      kind: "customer-resolved";
      customerId: string;
      atSeconds: number;
      resolution: Resolution;
    };

/**
 * Snapshot of an in-progress action round. Immutable — tick() returns a
 * new state.
 */
export interface ActionState {
  /** The board configuration (active + bench). Drawn from end-of-shop. */
  board: Board;
  /** Player-set price per active potion type. */
  prices: PriceMap;
  /** The 5 active potion types for this run. */
  activePotionTypes: readonly PotionTypeId[];
  /** Total seconds that have elapsed since the round began. */
  elapsedSeconds: number;
  /** Per-active-hireling action state, keyed by instance id. */
  hirelingStates: ReadonlyMap<string, HirelingActionState>;
  /** Customers currently in the marketplace (resolved or not). */
  customers: readonly CustomerState[];
  /** Append-only event log for tests and UI replay. */
  log: readonly ActionLogEntry[];
}

export type { Customer };
