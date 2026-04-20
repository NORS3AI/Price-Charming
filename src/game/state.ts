import { ALL_HIRELINGS } from "../cards/hirelings";
import { createStarterBoard } from "../board/starter";
import { STARTING_GOLD } from "../economy/gold";
import { createDiscovery } from "../potions/discovery";
import { mulberry32, RNG } from "../potions/rng";
import { selectActivePotionTypes } from "../potions/selection";
import { defaultPriceMap } from "../pricing/panel";
import { assignPotionsToPool } from "../shop/assignment";
import { createEmptyOffering } from "../shop/offering";
import { createInitialPool } from "../shop/pool";
import {
  FIRST_ROUND,
  GameState,
  REPUTATION_MAX,
  REPUTATION_MIN,
} from "./types";

/** Options accepted by createGame. All optional with sensible defaults. */
export interface CreateGameOptions {
  /**
   * Seeded RNG used for every random pick at game start (active potion
   * selection, Dusty Broom's potion, initial pool assignment). Tests
   * pass a mulberry32 for determinism.
   */
  rng?: RNG;
  /** Override the starting gold (spec default: 5g). */
  startingGold?: number;
  /** Override the starting reputation (default: 0). */
  startingReputation?: number;
  /** Pre-installed opponent snapshot, if any. */
  opponent?: GameState["opponent"];
}

/**
 * Build a fresh round-1 game state:
 *   - Pick 5 active potion types (random from 7).
 *   - Assign the starter Dusty Broom a random active potion type and
 *     place it at the center active slot.
 *   - Roll potion-type assignments across every hireling in the
 *     initial pool (Dusty Broom and Charm cards already excluded).
 *   - Set prices to 1g for every active type.
 *   - Empty discovery tracker — the player learns types by browsing.
 *   - Phase begins at "shop" with an empty offering — callers roll
 *     the first shop via Phase 4's `rollShop` (or Phase 10B's
 *     `startShopPhase`).
 */
export function createGame(options: CreateGameOptions = {}): GameState {
  const rng = options.rng ?? mulberry32(Date.now() >>> 0);
  const dustyBroom = ALL_HIRELINGS.find((h) => h.id === "dusty-broom");
  if (!dustyBroom) {
    throw new Error("Dusty Broom missing from ALL_HIRELINGS — cards.csv out of sync.");
  }

  const activePotionTypes = selectActivePotionTypes(rng);
  const { board, hand, broom } = createStarterBoard(
    dustyBroom,
    activePotionTypes,
    rng
  );
  const pool = assignPotionsToPool(createInitialPool(), activePotionTypes, rng);

  return {
    round: FIRST_ROUND,
    phase: "shop",
    outcome: "in-progress",
    gold: options.startingGold ?? STARTING_GOLD,
    reputation: clampReputation(options.startingReputation ?? 0),
    board,
    hand,
    pool,
    offering: createEmptyOffering(),
    prices: defaultPriceMap(activePotionTypes),
    activePotionTypes,
    discovery: createDiscovery(),
    opponent: options.opponent ?? null,
    action: null,
    starterBroom: broom,
  };
}

/** Clamp a reputation value to the spec's -30 / +30 envelope. */
export function clampReputation(rep: number): number {
  if (!Number.isFinite(rep)) {
    throw new Error(`reputation must be a finite number (got ${rep}).`);
  }
  return Math.max(REPUTATION_MIN, Math.min(REPUTATION_MAX, rep));
}
