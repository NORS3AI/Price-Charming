import { Board } from "../board/types";
import { PotionTypeId } from "../potions/types";
import { PriceMap } from "../pricing/panel";

/**
 * Immutable recording of another player's build at a specific round.
 * An ActionState running with a snapshot treats it as a passive,
 * never-reacting opponent — "async" because the snapshot was captured
 * earlier and plays the same routine regardless of what the player does.
 */
export interface OpponentSnapshot {
  /** Unique identifier for the snapshot (used on leaderboards later). */
  id: string;
  /** Round at which this build was captured — must match player's round. */
  round: number;
  /** The opponent's board configuration at capture time. */
  board: Board;
  /** The opponent's posted prices per potion type. */
  prices: PriceMap;
  /** The opponent's active potion types (may overlap with the player's). */
  activePotionTypes: readonly PotionTypeId[];
  /** Opponent's reputation when the snapshot was taken. */
  reputation: number;
}

/** Build an OpponentSnapshot from end-of-shop state. */
export function captureSnapshot(params: {
  id: string;
  round: number;
  board: Board;
  prices: PriceMap;
  activePotionTypes: readonly PotionTypeId[];
  reputation: number;
}): OpponentSnapshot {
  if (!Number.isInteger(params.round) || params.round < 1) {
    throw new Error(
      `captureSnapshot round must be a positive integer (got ${params.round}).`
    );
  }
  if (!params.id) {
    throw new Error("captureSnapshot id must be a non-empty string.");
  }
  return {
    id: params.id,
    round: params.round,
    board: params.board,
    prices: params.prices,
    activePotionTypes: params.activePotionTypes,
    reputation: params.reputation,
  };
}
