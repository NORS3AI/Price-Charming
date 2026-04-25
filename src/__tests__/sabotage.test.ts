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

describe("Sabotage-reactive hirelings (Phase 4)", () => {
  test("Snitch Witch: +1 permanent stock once per round when an ally Sabotages", () => {
    let b = createBoard();
    b = placeAt(b, 2, "Snitch Witch", "love");      // 5s cast
    b = placeAt(b, 3, "The Highwayman", "love");    // 7s cast — fires Sabotage
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = setOpponent(s, buildOpponent([3, "Doughboy", "love"]));
    // Tick 16s — Highwayman casts at 7s and 14s, so 2 sabotages fire.
    s = tick(s, 16, mulberry32(1));
    const sw = s.hirelingStates.get("Snitch Witch-2")!;
    // Once-per-round → +1 stock total even after 2 ally sabotages.
    expect(sw.permanentStockGainedThisRound).toBe(1);
  });

  test("Snitch Witch: own Sabotage doesn't trigger the reactive (only allies count)", () => {
    // Snitch Witch doesn't have Sabotage anyway, but verify the
    // reactive guard: applyOnAllySabotageAbility skips when the
    // saboteur is the reactor itself.
    let b = createBoard();
    b = placeAt(b, 3, "Snitch Witch", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = setOpponent(s, buildOpponent([3, "Doughboy", "love"]));
    s = tick(s, 6, mulberry32(1));
    const sw = s.hirelingStates.get("Snitch Witch-3")!;
    expect(sw.permanentStockGainedThisRound).toBe(0);
  });

  test("The Saboteur: each Sabotage success trims 0.5s from every Thieves ally's nextCastIn", () => {
    let b = createBoard();
    b = placeAt(b, 2, "Robbin Goblin", "love");  // Thieves, 4s cast
    b = placeAt(b, 3, "The Saboteur", "love");    // 6s cast, Sabotage x2
    b = placeAt(b, 5, "Doughboy", "love");        // Sugar — should NOT be reduced
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = setOpponent(s, buildOpponent([3, "Pantry Stocker", "love"]));
    // Tick to t=6 so Saboteur's 6s cast just fired. After his cast,
    // Thieves allies' nextCastIn dropped by 0.5s.
    s = tick(s, 6, mulberry32(1));
    const rg = s.hirelingStates.get("Robbin Goblin-2")!;
    const dough = s.hirelingStates.get("Doughboy-5")!;
    // Robbin Goblin: 4s cast cycle. After firing once at t=4, his next
    // cast was scheduled to fire at t=8 (timer 4s). At t=6 (after 2s
    // tick consumed since his last cast), his timer is 4 - 2 = 2s.
    // Then the Saboteur sabotage at t=6 nudges his timer down to 1.5s.
    expect(rg.nextCastIn).toBeCloseTo(1.5, 1);
    // Doughboy is Sugar (Quickcraft x2), not Thieves — untouched by
    // the Saboteur's Thieves-ally trim. His 5s cast at t=5 already
    // fired, so at t=6 his next cast scheduled in 4s (5-1).
    expect(dough.nextCastIn).toBeCloseTo(4, 1);
  });

  test("Royal Advisor: per-cast picks a Nobles ally and grants +2 perm stock + +2 perm potency", () => {
    let b = createBoard();
    b = placeAt(b, 1, "The Page", "love");        // Nobles ally (only one)
    b = placeAt(b, 3, "Royal Advisor", "love");    // 1-8s random cast
    b = placeAt(b, 5, "Doughboy", "love");         // Sugar — should NOT be buffed
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(7));
    s = setOpponent(s, buildOpponent([3, "Pantry Stocker", "love"]));
    s = tick(s, 9, mulberry32(7)); // long enough to guarantee a cast
    const page = s.hirelingStates.get("The Page-1")!;
    const dough = s.hirelingStates.get("Doughboy-5")!;
    // Page is the only Noble; she's picked. Sugar Doughboy untouched.
    expect(page.permanentStockGainedThisRound).toBeGreaterThanOrEqual(2);
    expect(page.permanentPotencyGainedThisRound).toBeGreaterThanOrEqual(2);
    expect(dough.permanentStockGainedThisRound).toBe(0);
    expect(dough.permanentPotencyGainedThisRound).toBe(0);
  });

  test("Royal Advisor: no buff fires when there are no Nobles allies", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Royal Advisor", "love"); // alone — no other Nobles
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(7));
    s = setOpponent(s, buildOpponent([3, "Pantry Stocker", "love"]));
    s = tick(s, 9, mulberry32(7));
    // Nothing gets a Royal Advisor buff log entry.
    const buffLog = s.log.find(
      (e) => e.kind === "ability-buff" && e.casterId === "Royal Advisor-3"
    );
    expect(buffLog).toBeUndefined();
  });

  test("Prince of Thieves: -2 reputation + sabotage opponent's highest-potency hireling (+3s)", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Prince of Thieves", "love"); // 8s cast
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1), 0, 0);
    // Opponent: low-pot Doughboy (4) and high-pot Lord Chamberlain (6).
    s = setOpponent(
      s,
      buildOpponent(
        [2, "Doughboy", "love"],          // potency 4
        [3, "Lord Chamberlain", "love"]    // potency 6 — should be the target
      )
    );
    s = tick(s, 9, mulberry32(1));
    const sab = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "sabotage" }> =>
        e.kind === "sabotage" && e.casterId === "Prince of Thieves-3"
    );
    expect(sab).toBeDefined();
    expect(sab!.targetInstanceId).toBe("Lord Chamberlain-3");
    expect(sab!.secondsAdded).toBe(3);
    expect(s.reputation).toBe(-2);
  });

  test("Prince of Thieves: -2 rep still deducts even when the opponent has no targets", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Prince of Thieves", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1), 0, 0);
    // No opponent set — sabotage is a no-op but rep cost still applies.
    s = tick(s, 9, mulberry32(1));
    expect(s.reputation).toBe(-2);
    expect(s.log.some((e) => e.kind === "sabotage")).toBe(false);
  });
});
