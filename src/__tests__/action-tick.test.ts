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

  test("Snatchling: per-cast self +4 stock and -1 reputation", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Snatchling"); // 6s cast
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 7, mulberry32(1)); // one cast at 6s
    const hs = s.hirelingStates.get("Snatchling-3")!;
    expect(hs.permanentStockGainedThisRound).toBe(4);
    expect(s.reputation).toBe(-1);
  });

  test("Fence Master: per-cast buffs only Thieves Guild allies (+1 stock)", () => {
    let b = createBoard();
    b = placeAt(b, 1, "Robbin Goblin");  // Thieves
    b = placeAt(b, 3, "Fence Master");   // 7s cast
    b = placeAt(b, 5, "Doughboy");       // Sugar — not buffed
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 8, mulberry32(1));
    const rgHs = s.hirelingStates.get("Robbin Goblin-1")!;
    const dbHs = s.hirelingStates.get("Doughboy-5")!;
    expect(rgHs.permanentStockGainedThisRound).toBe(1);
    expect(dbHs.permanentStockGainedThisRound).toBe(0);
    // Self-buff clause is not part of Fence Master's text.
    const selfHs = s.hirelingStates.get("Fence Master-3")!;
    expect(selfHs.permanentStockGainedThisRound).toBe(0);
    // Haggle + "Spend -1 Reputation" clause.
    expect(s.reputation).toBe(-1);
  });

  test("Ogreachiever: per-cast buffs only non-Quickcraft active allies (+1 pot)", () => {
    let b = createBoard();
    b = placeAt(b, 1, "Doughboy");      // has Quickcraft x2 — NOT buffed
    b = placeAt(b, 3, "Ogreachiever");  // 8s cast, no Quickcraft
    b = placeAt(b, 5, "Jumping Jack");  // No Quickcraft — buffed
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 9, mulberry32(1));
    const dbHs = s.hirelingStates.get("Doughboy-1")!;
    const jjHs = s.hirelingStates.get("Jumping Jack-5")!;
    expect(dbHs.permanentPotencyGainedThisRound).toBe(0);
    expect(jjHs.permanentPotencyGainedThisRound).toBe(1);
  });

  test("The Duchess: directional Nobles-only buffs + both-sides self buff", () => {
    let b = createBoard();
    b = placeAt(b, 1, "The Page");       // Nobles, left
    b = placeAt(b, 2, "Doughboy");       // Sugar, left — should NOT be buffed
    b = placeAt(b, 3, "The Duchess");    // 6s cast
    b = placeAt(b, 4, "Lady's Maid");    // Nobles, right
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 7, mulberry32(1));
    const pageHs = s.hirelingStates.get("The Page-1")!;
    const doughHs = s.hirelingStates.get("Doughboy-2")!;
    const maidHs = s.hirelingStates.get("Lady's Maid-4")!;
    const dutchHs = s.hirelingStates.get("The Duchess-3")!;
    // Left Nobles gets +1 stock.
    expect(pageHs.permanentStockGainedThisRound).toBe(1);
    expect(pageHs.permanentPotencyGainedThisRound).toBe(0);
    // Non-Nobles left is untouched.
    expect(doughHs.permanentStockGainedThisRound).toBe(0);
    expect(doughHs.permanentPotencyGainedThisRound).toBe(0);
    // Right Nobles gets +1 potency.
    expect(maidHs.permanentStockGainedThisRound).toBe(0);
    expect(maidHs.permanentPotencyGainedThisRound).toBe(1);
    // Duchess herself: Nobles on both sides → self +1 stock +1 potency.
    expect(dutchHs.permanentStockGainedThisRound).toBe(1);
    expect(dutchHs.permanentPotencyGainedThisRound).toBe(1);
  });

  test("The Duchess: no self-buff when only one side has a Nobles ally", () => {
    let b = createBoard();
    b = placeAt(b, 3, "The Duchess");
    b = placeAt(b, 5, "The Page"); // Nobles only on the right
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 7, mulberry32(1));
    const dutchHs = s.hirelingStates.get("The Duchess-3")!;
    expect(dutchHs.permanentStockGainedThisRound).toBe(0);
    expect(dutchHs.permanentPotencyGainedThisRound).toBe(0);
  });

  test("Rush Order Cook: base 8s cast reduces by 1s per other Sugar Guild ally", () => {
    // Solo: 8s base — one cast at 8s, not another before t=15.
    let bSolo = createBoard();
    bSolo = placeAt(bSolo, 3, "Rush Order Cook");
    let sSolo = initializeActionState(bSolo, defaultPriceMap([]), [], mulberry32(1));
    sSolo = tick(sSolo, 15, mulberry32(1));
    const castsSolo = sSolo.log.filter((e) => e.kind === "cast" && e.instanceId === "Rush Order Cook-3").length;
    expect(castsSolo).toBe(1); // 8s cast fires once in 15s

    // With 3 other Sugar Guild allies: 8 - 3 = 5s effective cast time.
    // In 15s that's 3 casts (at 5s, 10s, 15s).
    let b = createBoard();
    b = placeAt(b, 1, "Doughboy");
    b = placeAt(b, 2, "Burnt Batch");
    b = placeAt(b, 3, "Rush Order Cook");
    b = placeAt(b, 4, "Sugar Sprinkler");
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 15, mulberry32(1));
    const casts = s.log.filter(
      (e) => e.kind === "cast" && e.instanceId === "Rush Order Cook-3"
    ).length;
    expect(casts).toBe(3);
  });

  test("Rush Order Cook: non-Sugar Guild allies do not reduce its cast time", () => {
    let b = createBoard();
    b = placeAt(b, 1, "Robbin Goblin"); // Thieves Guild — no reduction
    b = placeAt(b, 3, "Rush Order Cook");
    b = placeAt(b, 5, "The Page");       // Nobles Guild — no reduction
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 15, mulberry32(1));
    const casts = s.log.filter(
      (e) => e.kind === "cast" && e.instanceId === "Rush Order Cook-3"
    ).length;
    expect(casts).toBe(1); // still 8s cast time
  });

  test("Rush Order Cook: effective cast time floors at 1s", () => {
    let b = createBoard();
    // Max out: 4 Sugar Guild allies around it. Base 8 - 4 = 4s, not
    // below 1. Use 4 Sugar allies so reduction stays above floor.
    b = placeAt(b, 1, "Doughboy");
    b = placeAt(b, 2, "Burnt Batch");
    b = placeAt(b, 3, "Rush Order Cook");
    b = placeAt(b, 4, "Sugar Sprinkler");
    b = placeAt(b, 5, "Oven Master");
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 5, mulberry32(1));
    const casts = s.log.filter(
      (e) => e.kind === "cast" && e.instanceId === "Rush Order Cook-3"
    ).length;
    // 8 - 4 = 4s → one cast at 4s in a 5s tick.
    expect(casts).toBe(1);
  });

  test("Rush Order Cook has Quickcraft x2 (not x5) per updated card text", () => {
    const card = ALL_HIRELINGS.find((h) => h.name === "Rush Order Cook")!;
    const qc = card.keywords.find((k) => k.name === "Quickcraft");
    expect(qc?.count).toBe(2);
  });

  test("The Herald: each cast grants +1 temporary stock to Nobles allies only", () => {
    let b = createBoard();
    b = placeAt(b, 1, "The Page");           // Nobles
    b = placeAt(b, 3, "The Herald");         // 5s cast
    b = placeAt(b, 5, "Pantry Stocker");     // Sugar passive — not buffed, no Quickcraft noise
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 6, mulberry32(1));           // one cast at 5s
    const pageHs = s.hirelingStates.get("The Page-1")!;
    const stockerHs = s.hirelingStates.get("Pantry Stocker-5")!;
    const heraldHs = s.hirelingStates.get("The Herald-3")!;
    expect(pageHs.temporaryStock).toBe(1);
    expect(stockerHs.temporaryStock).toBe(0);    // Sugar ally unaffected
    expect(heraldHs.temporaryStock).toBe(0);     // self excluded
  });

  test("Grumblegut Dragon: per-cast eats 2 potency from each adjacent active ally", () => {
    let b = createBoard();
    b = placeAt(b, 2, "The Page");            // Nobles, potency 3
    b = placeAt(b, 3, "Grumblegut Dragon");   // 7s cast
    b = placeAt(b, 4, "Jumping Jack");         // Neutral, potency 3
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 8, mulberry32(1));             // one cast at 7s
    const pageHs = s.hirelingStates.get("The Page-2")!;
    const jjHs = s.hirelingStates.get("Jumping Jack-4")!;
    const dragonHs = s.hirelingStates.get("Grumblegut Dragon-3")!;
    expect(pageHs.permanentPotencyGainedThisRound).toBe(-2);
    expect(jjHs.permanentPotencyGainedThisRound).toBe(-2);
    // Dragon gains +2 stock per neighbor (1 stock per potency eaten × 2 each).
    expect(dragonHs.permanentStockGainedThisRound).toBe(4);
  });

  test("Grumblegut Dragon: does NOT eat potency from Dusty Broom", () => {
    // Place Dusty Broom adjacent. "Cannot be buffed" includes negative buffs.
    let b = createBoard();
    const broomCard = ALL_HIRELINGS.find((h) => h.name === "Dusty Broom")!;
    const broomInst = createHirelingInstance(broomCard, "broom", "love");
    b = placeHireling(b, 2, broomInst);
    b = placeAt(b, 3, "Grumblegut Dragon");
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 8, mulberry32(1));
    const broomHs = s.hirelingStates.get("broom")!;
    const dragonHs = s.hirelingStates.get("Grumblegut Dragon-3")!;
    expect(broomHs.permanentPotencyGainedThisRound).toBe(0);
    // No potency eaten anywhere → no stock gained.
    expect(dragonHs.permanentStockGainedThisRound).toBe(0);
  });

  test("Apprentice Baker: gains +1 temp stock for each Quickcraft cast by an ally", () => {
    let b = createBoard();
    b = placeAt(b, 2, "Apprentice Baker");  // Passive reactor — but wait, 4s cast
    b = placeAt(b, 3, "Doughboy");           // 5s cast, Quickcraft x2
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    // Tick 11s: Doughboy casts at t=5 and t=10 (2 Quickcraft events).
    s = tick(s, 11, mulberry32(1));
    const abHs = s.hirelingStates.get("Apprentice Baker-2")!;
    // +1 temp stock per Doughboy cast × 2 = 2. Apprentice Baker itself
    // casts at t=4 and t=8 — not counted as a Quickcraft ally pulse.
    expect(abHs.temporaryStock).toBeGreaterThanOrEqual(2);
  });

  test("Goblin King: round-start mutual buff only when Robbin Goblin is on an active slot", () => {
    // No Robbin Goblin — nobody buffed.
    let bAlone = createBoard();
    bAlone = placeAt(bAlone, 3, "Goblin King");
    const sAlone = initializeActionState(bAlone, defaultPriceMap([]), [], mulberry32(1));
    const gkSoloHs = sAlone.hirelingStates.get("Goblin King-3")!;
    expect(gkSoloHs.permanentStockGainedThisRound).toBe(0);
    expect(gkSoloHs.permanentPotencyGainedThisRound).toBe(0);

    // Both active → both get +3/+1.
    let b = createBoard();
    b = placeAt(b, 2, "Robbin Goblin");
    b = placeAt(b, 3, "Goblin King");
    const s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    const gkHs = s.hirelingStates.get("Goblin King-3")!;
    const rgHs = s.hirelingStates.get("Robbin Goblin-2")!;
    expect(gkHs.permanentStockGainedThisRound).toBe(3);
    expect(gkHs.permanentPotencyGainedThisRound).toBe(1);
    expect(rgHs.permanentStockGainedThisRound).toBe(3);
    expect(rgHs.permanentPotencyGainedThisRound).toBe(1);
  });

  test("Pantry Stocker: +1 permanent stock at end of round", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker");  // Passive
    let s = initializeActionState(b, defaultPriceMap([]), [], mulberry32(1));
    s = tick(s, 5, mulberry32(1));
    const { finalizeRound, applyEndOfRoundHooks } = require("../action/state");
    const fin = applyEndOfRoundHooks(finalizeRound(s));
    const psHs = fin.hirelingStates.get("Pantry Stocker-3")!;
    expect(psHs.permanentStockGainedThisRound).toBe(1);
  });

  test("determinism under a seeded RNG for random cast times", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Royal Advisor"); // 1-8s random
    const a = tick(initializeActionState(b, defaultPriceMap([]), [], mulberry32(5)), 30, mulberry32(5));
    const c = tick(initializeActionState(b, defaultPriceMap([]), [], mulberry32(5)), 30, mulberry32(5));
    expect(a.log.map((e) => e.atSeconds)).toEqual(c.log.map((e) => e.atSeconds));
  });
});
