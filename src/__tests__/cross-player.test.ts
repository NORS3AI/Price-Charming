import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { Board } from "../board/types";
import { mulberry32 } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { defaultPriceMap } from "../pricing/panel";
import { initializeActionState, setOpponent, tick, addCustomer } from "../action/state";
import { captureSnapshot } from "../opponent/snapshot";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

function placeAt(b: Board, slot: number, name: string, potion: PotionTypeId): Board {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  return placeHireling(b, slot, createHirelingInstance(card, `${name}-${slot}`, potion));
}

function buildOpponent(...placements: Array<[number, string, PotionTypeId]>) {
  let oppBoard = createBoard();
  for (const [slot, name, potion] of placements) {
    oppBoard = placeAt(oppBoard, slot, name, potion);
  }
  return captureSnapshot({
    id: "opp",
    round: 1,
    board: oppBoard,
    prices: defaultPriceMap(ACTIVE),
    activePotionTypes: ACTIVE,
    reputation: 0,
  });
}

describe("Cross-player opponent effects (Phase 8)", () => {
  test("Robbin Goblin: gains +1 permanent stock per cast when potency < 5 and opp has hirelings", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Robbin Goblin", "love"); // potency 2 < 5
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = setOpponent(s, buildOpponent([3, "Doughboy", "love"]));
    s = tick(s, 5, mulberry32(1)); // 4s cast → one cast at 4s
    const rg = s.hirelingStates.get("Robbin Goblin-3")!;
    expect(rg.permanentStockGainedThisRound).toBeGreaterThanOrEqual(1);
  });

  test("Robbin Goblin: no buff when no opponent on board", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Robbin Goblin", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = tick(s, 5, mulberry32(1));
    const rg = s.hirelingStates.get("Robbin Goblin-3")!;
    expect(rg.permanentStockGainedThisRound).toBe(0);
  });

  test("Puss in Boots: per cast steals 1 rep star from each unresolved customer >1 star", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Puss in Boots", "love"); // 9s cast
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, {
      id: "c1", desiredType: "luck", budget: 5, qualityThreshold: 1,
      reputationStars: 5, patienceSeconds: 20,
      axisPriority: ["focus", "type", "budget", "quality"],
    });
    s = addCustomer(s, {
      id: "c2", desiredType: "luck", budget: 5, qualityThreshold: 1,
      reputationStars: 1, patienceSeconds: 20, // already at floor → not stealable
      axisPriority: ["focus", "type", "budget", "quality"],
    });
    s = tick(s, 10, mulberry32(1));
    expect(s.customers[0].customer.reputationStars).toBe(4); // 5 → 4
    expect(s.customers[1].customer.reputationStars).toBe(1); // 1 → 1 (floor)
    const puss = s.hirelingStates.get("Puss in Boots-3")!;
    expect(puss.permanentStockGainedThisRound).toBeGreaterThanOrEqual(1);
  });

  test("Batter Boy (via endShopPhase): +3 temp stock per opp Sabotage hireling", () => {
    const { createGame } = require("../game/state");
    const { endShopPhase } = require("../game/action-phase");
    let g = createGame({ rng: mulberry32(1), startingGold: 5 });
    let b = createBoard();
    b = placeAt(b, 3, "Batter Boy", "love");
    g = { ...g, board: b };
    g = {
      ...g,
      opponent: buildOpponent(
        [2, "The Highwayman", "love"],
        [3, "The Saboteur", "luck"]
      ),
    };
    const next = endShopPhase(g, mulberry32(1));
    // 2 opp saboteurs → +3 × 2 = 6 temp stock.
    expect(next.action.hirelingStates.get("Batter Boy-3")!.temporaryStock).toBe(6);
  });

  test("Frosted Lookout (via endShopPhase): when opp has Sabotage, triggers highest-pot Sugar ally's ability", () => {
    const { createGame } = require("../game/state");
    const { endShopPhase } = require("../game/action-phase");
    let g = createGame({ rng: mulberry32(1), startingGold: 5 });
    let b = createBoard();
    b = placeAt(b, 1, "Doughboy", "love");           // adjacent to Sprinkler
    b = placeAt(b, 2, "Sugar Sprinkler", "love");     // potency 5 — highest Sugar
    b = placeAt(b, 3, "Frosted Lookout", "love");     // potency 5 too, but excluded (self)
    b = placeAt(b, 5, "Pantry Stocker", "love");      // potency 3
    g = { ...g, board: b };
    g = { ...g, opponent: buildOpponent([3, "The Highwayman", "love"]) };
    const next = endShopPhase(g, mulberry32(1));
    // Frosted Lookout fires Sugar Sprinkler's ability → adjacent allies
    // (Doughboy at 1, Frosted Lookout at 3) get +1 perm potency.
    const dough = next.action.hirelingStates.get("Doughboy-1")!;
    expect(dough.permanentPotencyGainedThisRound).toBe(1);
  });
});
