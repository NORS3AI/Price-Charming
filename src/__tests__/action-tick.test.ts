import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { Board } from "../board/types";
import { mulberry32 } from "../potions/rng";
import { defaultPriceMap } from "../pricing/panel";
import {
  firstCastDelay,
  initializeActionState,
  nextCastDelay,
  tick,
} from "../action/state";
import { ActionLogEntry } from "../action/types";

function placeAt(b: Board, slot: number, name: string): Board {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  const inst = createHirelingInstance(card, `${name}-${slot}`, "love");
  return placeHireling(b, slot, inst);
}

describe("cast delay helpers", () => {
  test("seconds variant returns its value", () => {
    expect(firstCastDelay({ kind: "seconds", value: 5 }, mulberry32(1))).toBe(5);
    expect(nextCastDelay({ kind: "seconds", value: 5 }, 10, mulberry32(1))).toBe(
      5
    );
  });

  test("passive never fires", () => {
    expect(firstCastDelay({ kind: "passive" }, mulberry32(1))).toBeNull();
    expect(nextCastDelay({ kind: "passive" }, 3, mulberry32(1))).toBeNull();
  });

  test("random is within [min, max)", () => {
    for (let s = 0; s < 20; s++) {
      const v = firstCastDelay({ kind: "random", min: 1, max: 8 }, mulberry32(s))!;
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThan(8);
    }
  });

  test("decreasing steps down by decrementPerCast and returns null at zero", () => {
    const ct = { kind: "decreasing" as const, start: 3, decrementPerCast: 1 };
    expect(firstCastDelay(ct, mulberry32(1))).toBe(3);
    expect(nextCastDelay(ct, 1, mulberry32(1))).toBe(2);
    expect(nextCastDelay(ct, 2, mulberry32(1))).toBe(1);
    expect(nextCastDelay(ct, 3, mulberry32(1))).toBeNull();
    expect(nextCastDelay(ct, 4, mulberry32(1))).toBeNull();
  });
});

describe("initializeActionState", () => {
  test("only registers active-slot hirelings (slots 1..5)", () => {
    let b = createBoard();
    b = placeAt(b, 0, "Doughboy"); // bench
    b = placeAt(b, 3, "Doughboy"); // active
    b = placeAt(b, 6, "Doughboy"); // bench

    const state = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    expect(state.elapsedSeconds).toBe(0);
    expect(state.hirelingStates.size).toBe(1);
    expect(state.hirelingStates.has("Doughboy-3")).toBe(true);
    expect(state.log).toEqual([]);
  });

  test("schedules the first cast at the card's cast time", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Doughboy"); // 5s cast time
    const state = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    expect(state.hirelingStates.get("Doughboy-3")!.nextCastIn).toBe(5);
  });

  test("passive hirelings get null nextCastIn", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker"); // Passive
    const state = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    expect(state.hirelingStates.get("Pantry Stocker-3")!.nextCastIn).toBeNull();
  });
});

describe("tick", () => {
  test("zero-length tick returns the same state", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Doughboy");
    const s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    expect(tick(s, 0, mulberry32(1))).toBe(s);
  });

  test("rejects negative, NaN, and infinite delta", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Doughboy");
    const s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    expect(() => tick(s, -1, mulberry32(1))).toThrow();
    expect(() => tick(s, NaN, mulberry32(1))).toThrow();
    expect(() => tick(s, Infinity, mulberry32(1))).toThrow();
  });

  test("advances elapsed time and decrements cast timers", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Doughboy"); // 5s cast
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 2, mulberry32(1));
    expect(s.elapsedSeconds).toBe(2);
    expect(s.hirelingStates.get("Doughboy-3")!.nextCastIn).toBe(3);
  });

  test("fires a cast exactly when the timer hits 0 and reschedules", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Doughboy"); // 5s, Quickcraft x2
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 5, mulberry32(1));
    const hs = s.hirelingStates.get("Doughboy-3")!;
    expect(hs.castsSoFar).toBe(1);
    expect(hs.temporaryStock).toBe(2);
    expect(hs.nextCastIn).toBe(5);

    const cast = s.log.find((e): e is Extract<ActionLogEntry, { kind: "cast" }> =>
      e.kind === "cast"
    );
    expect(cast?.atSeconds).toBe(5);
    expect(cast?.castNumber).toBe(1);

    const qc = s.log.find((e): e is Extract<ActionLogEntry, { kind: "quickcraft" }> =>
      e.kind === "quickcraft"
    );
    expect(qc?.stockAdded).toBe(2);
  });

  test("a long tick fires multiple casts and carries overshoot", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Doughboy"); // 5s cast, Quickcraft x2
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 12, mulberry32(1)); // enough for 2 casts (10s), 2s into the 3rd
    const hs = s.hirelingStates.get("Doughboy-3")!;
    expect(hs.castsSoFar).toBe(2);
    expect(hs.temporaryStock).toBe(4);
    // 12 - 5 - 5 = 2 elapsed into the third timer, so remaining = 3
    expect(hs.nextCastIn).toBe(3);
  });

  test("decreasing cast time stops the hireling permanently at zero", () => {
    // The Grand Vizier: 7s, decreases by 1s per cast. Intervals:
    // 7, 6, 5, 4, 3, 2, 1 → 7 casts total (at 7s, 13s, 18s, 22s, 25s, 27s, 28s).
    // After the 7th cast the next delay would be 7 - 7 = 0 → null, stopped.
    let b = createBoard();
    b = placeAt(b, 3, "The Grand Vizier");
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 60, mulberry32(1));
    const hs = s.hirelingStates.get("The Grand Vizier-3")!;
    expect(hs.castsSoFar).toBe(7);
    expect(hs.nextCastIn).toBeNull();
    const stopped = s.log.find((e) => e.kind === "stopped");
    expect(stopped).toBeDefined();
  });

  test("passive hireling never logs a cast", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker");
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 100, mulberry32(1));
    expect(s.log.filter((e) => e.kind === "cast").length).toBe(0);
  });

  test("cast atSeconds reflects the true fire time, not end-of-tick", () => {
    let b = createBoard();
    // Burnt Batch: 3s cast time, Quickcraft x2.
    b = placeAt(b, 3, "Burnt Batch");
    let s = initializeActionState(
      b,
      defaultPriceMap([]),
      [],
      mulberry32(1)
    );
    // One 10-second tick should fire three casts at t=3, 6, 9 — not 10.
    s = tick(s, 10, mulberry32(1));
    const castTimes = s.log
      .filter(
        (e): e is Extract<ActionLogEntry, { kind: "cast" }> =>
          e.kind === "cast"
      )
      .map((e) => e.atSeconds);
    expect(castTimes).toEqual([3, 6, 9]);
  });

  test("Sugar Sprinkler grants +1 permanent potency to adjacent allies on every cast", () => {
    let b = createBoard();
    // Put Sugar Sprinkler at slot 3, adjacent hirelings at 2 and 4.
    b = placeAt(b, 2, "Doughboy");
    b = placeAt(b, 3, "Sugar Sprinkler"); // 5s cast, ability: adjacent +1 potency
    b = placeAt(b, 4, "Doughboy");
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    // Tick 11s → Sugar Sprinkler casts twice (at 5s and 10s). Each cast
    // buffs both adjacent Doughboys by +1 potency.
    s = tick(s, 11, mulberry32(1));
    const leftHs = s.hirelingStates.get("Doughboy-2")!;
    const rightHs = s.hirelingStates.get("Doughboy-4")!;
    expect(leftHs.permanentPotencyGainedThisRound).toBe(2);
    expect(rightHs.permanentPotencyGainedThisRound).toBe(2);
    // Caster doesn't buff itself.
    const selfHs = s.hirelingStates.get("Sugar Sprinkler-3")!;
    expect(selfHs.permanentPotencyGainedThisRound).toBe(0);
    // Log entries emitted per buff (2 casts × 2 targets = 4 entries).
    const buffLog = s.log.filter((e) => e.kind === "ability-buff");
    expect(buffLog.length).toBe(4);
  });

  test("Oven Master buffs every active ally (excluding self) per cast", () => {
    let b = createBoard();
    b = placeAt(b, 1, "Doughboy");
    b = placeAt(b, 3, "Oven Master"); // 6s cast, ability: allies +2 potency
    b = placeAt(b, 5, "Doughboy");
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 7, mulberry32(1)); // one cast at 6s
    const leftHs = s.hirelingStates.get("Doughboy-1")!;
    const rightHs = s.hirelingStates.get("Doughboy-5")!;
    expect(leftHs.permanentPotencyGainedThisRound).toBe(2);
    expect(rightHs.permanentPotencyGainedThisRound).toBe(2);
    const selfHs = s.hirelingStates.get("Oven Master-3")!;
    expect(selfHs.permanentPotencyGainedThisRound).toBe(0);
  });

  test("Lord Chamberlain only buffs Nobles Guild allies on cast", () => {
    let b = createBoard();
    b = placeAt(b, 1, "The Page");        // Nobles Guild
    b = placeAt(b, 3, "Lord Chamberlain"); // 7s cast
    b = placeAt(b, 5, "Doughboy");         // Sugar Guild — should NOT be buffed
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 8, mulberry32(1)); // one cast at 7s
    const pageHs = s.hirelingStates.get("The Page-1")!;
    const doughboyHs = s.hirelingStates.get("Doughboy-5")!;
    expect(pageHs.permanentStockGainedThisRound).toBe(1);
    expect(pageHs.permanentPotencyGainedThisRound).toBe(1);
    expect(doughboyHs.permanentStockGainedThisRound).toBe(0);
    expect(doughboyHs.permanentPotencyGainedThisRound).toBe(0);
  });

  test("determinism under a seeded RNG for random cast times", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Royal Advisor"); // 1-8s random
    const a = tick(initializeActionState(b, defaultPriceMap([]), [], mulberry32(5)), 30, mulberry32(5));
    const c = tick(initializeActionState(b, defaultPriceMap([]), [], mulberry32(5)), 30, mulberry32(5));
    expect(a.log.map((e) => e.atSeconds)).toEqual(c.log.map((e) => e.atSeconds));
  });
});
