import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { Board, HirelingInstance } from "../board/types";
import { mulberry32 } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { defaultPriceMap } from "../pricing/panel";
import {
  initializeActionState,
  setOpponent,
  tick,
  SABOTAGE_DEFAULT_SECONDS,
} from "../action/state";
import { captureSnapshot } from "../opponent/snapshot";
import { ActionLogEntry } from "../action/types";

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

function buildOpponent(...placements: Array<[number, string, PotionTypeId]>): ReturnType<typeof captureSnapshot> {
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

describe("Sabotage primitive", () => {
  test("Sabotage keyword (no count) emits a `sabotage` log entry with default +1s", () => {
    let b = createBoard();
    b = placeAt(b, 3, "The Highwayman", "love"); // 7s cast, Sabotage + Bewitch + Knockoff x3
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = setOpponent(s, buildOpponent([3, "Doughboy", "love"]));
    s = tick(s, 8, mulberry32(1)); // one cast at 7s
    const sab = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "sabotage" }> => e.kind === "sabotage"
    );
    expect(sab).toBeDefined();
    expect(sab!.casterId).toBe("The Highwayman-3");
    expect(sab!.targetInstanceId).toBe("Doughboy-3");
    expect(sab!.secondsAdded).toBe(SABOTAGE_DEFAULT_SECONDS);
  });

  test("Sabotage with no opponent on board → no log entry", () => {
    let b = createBoard();
    b = placeAt(b, 3, "The Highwayman", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    // No opponent set.
    s = tick(s, 8, mulberry32(1));
    expect(s.log.some((e) => e.kind === "sabotage")).toBe(false);
  });

  test("Sabotage x2 applies +2 seconds (count override)", () => {
    let b = createBoard();
    b = placeAt(b, 3, "The Saboteur", "love"); // 6s cast, Sabotage x2 + Knockoff x1
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = setOpponent(s, buildOpponent([3, "Doughboy", "love"]));
    s = tick(s, 7, mulberry32(1));
    const sab = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "sabotage" }> => e.kind === "sabotage"
    );
    expect(sab).toBeDefined();
    expect(sab!.secondsAdded).toBe(2);
  });

  test("Sticky Fingers: sabotages the opponent's LOWEST-cast-time hireling and gains +2 temp stock", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Sticky Fingers", "love"); // 6s cast
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    // Opponent: Doughboy (5s) and Lord Chamberlain (7s) and Burnt Batch (3s).
    // Lowest cast = Burnt Batch (3s).
    s = setOpponent(
      s,
      buildOpponent(
        [2, "Doughboy", "love"],
        [3, "Burnt Batch", "luck"],
        [4, "Lord Chamberlain", "love"]
      )
    );
    s = tick(s, 7, mulberry32(1));
    const sab = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "sabotage" }> => e.kind === "sabotage"
    );
    expect(sab).toBeDefined();
    expect(sab!.targetInstanceId).toBe("Burnt Batch-3");

    // +2 temporary stock to self.
    const sf = s.hirelingStates.get("Sticky Fingers-3")!;
    expect(sf.temporaryStock).toBe(2);
  });

  test("default Sabotage target is random — multiple seeds yield different targets", () => {
    // Two opponent hirelings; over multiple seeds, we should see both
    // chosen at least once. (Deterministic with mulberry32; different
    // seeds pick different indices.)
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
    const picks = new Set<string>();
    for (const seed of seeds) {
      let b = createBoard();
      b = placeAt(b, 3, "The Highwayman", "love");
      let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(seed));
      s = setOpponent(
        s,
        buildOpponent([2, "Doughboy", "love"], [4, "Pantry Stocker", "love"])
      );
      s = tick(s, 8, mulberry32(seed));
      const sab = s.log.find(
        (e): e is Extract<ActionLogEntry, { kind: "sabotage" }> => e.kind === "sabotage"
      );
      if (sab) picks.add(sab.targetInstanceId);
    }
    expect(picks.size).toBeGreaterThanOrEqual(2);
  });

  test("non-Sabotage hireling never emits a sabotage entry", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Doughboy", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = setOpponent(s, buildOpponent([3, "Pantry Stocker", "love"]));
    s = tick(s, 6, mulberry32(1));
    expect(s.log.some((e) => e.kind === "sabotage")).toBe(false);
  });

  test("Sticky Fingers emits a sabotage log on each cast (multi-cast scaling)", () => {
    // 6s cast → 2 casts in 13s.
    let b = createBoard();
    b = placeAt(b, 3, "Sticky Fingers", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = setOpponent(s, buildOpponent([3, "Doughboy", "love"]));
    s = tick(s, 13, mulberry32(1));
    const count = s.log.filter((e) => e.kind === "sabotage").length;
    expect(count).toBe(2);
  });
});
