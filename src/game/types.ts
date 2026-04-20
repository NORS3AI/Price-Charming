import { ActionState } from "../action/types";
import { Board, Hand, HirelingInstance } from "../board/types";
import { OpponentSnapshot } from "../opponent/snapshot";
import { PotionDiscovery } from "../potions/discovery";
import { PotionTypeId } from "../potions/types";
import { PriceMap } from "../pricing/panel";
import { ShopOffering } from "../shop/offering";
import { ShopPool } from "../shop/pool";

/** Maximum number of shop/action rounds in a full game. */
export const MAX_ROUNDS = 15;

/** Starting round index. Shop phase of round 1 is the opening state. */
export const FIRST_ROUND = 1;

/** Reputation bounds per spec: -30 floor, +30 ceiling (no crunch yet). */
export const REPUTATION_MIN = -30;
export const REPUTATION_MAX = 30;

/**
 * Which phase of a round the game is currently in:
 *   - `"shop"`: player buys / sells / plays spells / sets prices.
 *   - `"action"`: hirelings cast on timers and sell to customers.
 *   - `"game-over"`: final state, no further transitions.
 */
export type GamePhase = "shop" | "action" | "game-over";

/** Final outcome of a game — `"in-progress"` while still playing. */
export type GameOutcome = "in-progress" | "win" | "loss";

/**
 * Complete snapshot of a Price Charming game between rounds / phases.
 * Immutable — round-transition helpers return a new state.
 */
export interface GameState {
  round: number;
  phase: GamePhase;
  outcome: GameOutcome;
  gold: number;
  reputation: number;
  board: Board;
  hand: Hand;
  pool: ShopPool;
  offering: ShopOffering;
  prices: PriceMap;
  activePotionTypes: readonly PotionTypeId[];
  discovery: PotionDiscovery;
  opponent: OpponentSnapshot | null;
  /** Populated while `phase === "action"`; null otherwise. */
  action: ActionState | null;
  /** Dusty Broom instance so the caller can look it up for payday exemption, UI, etc. */
  starterBroom: HirelingInstance;
}
