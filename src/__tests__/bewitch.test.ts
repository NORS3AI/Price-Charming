import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { Board } from "../board/types";
import { Customer } from "../customers/types";
import { mulberry32 } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { defaultPriceMap, setPrice } from "../pricing/panel";
import {
  addCustomer,
  initializeActionState,
  tick,
  BEWITCH_FOCUS_BURST,
  MAX_BEWITCH_LEVEL,
} from "../action/state";
import { ActionLogEntry } from "../action/types";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

function placeAt(
  b: Board,
  slot: number,
  name: string,
  potion: PotionTypeId
): Board {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  return placeHireling(
    b,
    slot,
    createHirelingInstance(card, `${name}-${slot}`, potion)
  );
}

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c-bewitch",
    desiredType: "love",
    budget: 5,
    qualityThreshold: 3,
    reputationStars: 3,
    patienceSeconds: 20,
    axisPriority: ["focus", "type", "budget", "quality"],
    ...overrides,
  };
}

describe("Bewitch primitive", () => {
  test("a Bewitch cast pushes the player's focus axis by BEWITCH_FOCUS_BURST", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Candied Witch", "love"); // 5s cast, Bewitch keyword
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer());
    s = tick(s, 6, mulberry32(1)); // cast fires at 5s
    expect(s.customers[0].axes.focus.playerFill).toBeGreaterThanOrEqual(
      BEWITCH_FOCUS_BURST
    );
    expect(s.customers[0].bewitchedByIds).toContain("Candied Witch-3");
  });

  test("a bewitch log entry records the caster, customer(s), and burst", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Candied Witch", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer());
    s = tick(s, 6, mulberry32(1));
    const bewitch = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "bewitch" }> =>
        e.kind === "bewitch"
    );
    expect(bewitch).toBeDefined();
    expect(bewitch!.casterId).toBe("Candied Witch-3");
    expect(bewitch!.customerIds).toEqual(["c-bewitch"]);
    expect(bewitch!.focusBurst).toBe(BEWITCH_FOCUS_BURST);
  });

  test("a hireling does not re-Bewitch the same customer twice", () => {
    // Candied Witch casts every 5s; across 11s it casts twice but the
    // same customer only gets tagged by this caster once.
    let b = createBoard();
    b = placeAt(b, 3, "Candied Witch", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer());
    s = tick(s, 11, mulberry32(1));
    const tags = s.customers[0].bewitchedByIds.filter(
      (id) => id === "Candied Witch-3"
    );
    expect(tags.length).toBe(1);
  });

  test("bewitchLevel starts at 1 and bumps to 2 after selling to a Bewitched customer", () => {
    // Masked Minstrel: 6s cast, Knockoff x2 + Bewitch + Haggle. It will
    // Bewitch the customer at 6s, then the customer (patience 12s,
    // budget high) resolves for the player and is sold to.
    let b = createBoard();
    b = placeAt(b, 3, "Masked Minstrel", "love");
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 3);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(
      s,
      makeCustomer({
        patienceSeconds: 12,
        reputationStars: 2,
        budget: 20,
        qualityThreshold: 1,
      })
    );
    s = tick(s, 12, mulberry32(1));
    const mm = s.hirelingStates.get("Masked Minstrel-3")!;
    // Sold (unitsSoldThisRound > 0) + had Bewitched the customer →
    // bewitchLevel bumped to 2.
    expect(mm.unitsSoldThisRound).toBeGreaterThan(0);
    expect(mm.bewitchLevel).toBe(2);
  });

  test("bewitchLevel caps at MAX_BEWITCH_LEVEL even after multiple Bewitched sales", () => {
    // Multiple sales via addCustomer loop — bewitchLevel must not
    // exceed MAX_BEWITCH_LEVEL (2).
    let b = createBoard();
    b = placeAt(b, 3, "Masked Minstrel", "love");
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 3);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    for (let i = 0; i < 5; i++) {
      s = addCustomer(
        s,
        makeCustomer({
          id: `c${i}`,
          patienceSeconds: 15,
          reputationStars: 2,
          budget: 20,
          qualityThreshold: 1,
        })
      );
      s = tick(s, 8, mulberry32(i + 1));
    }
    const mm = s.hirelingStates.get("Masked Minstrel-3")!;
    expect(mm.bewitchLevel).toBeLessThanOrEqual(MAX_BEWITCH_LEVEL);
  });

  test("a level-2 Bewitch targets up to 2 unresolved customers simultaneously", () => {
    // Pre-bump the caster's bewitchLevel to 2 by setting it on the
    // initial state directly.
    let b = createBoard();
    b = placeAt(b, 3, "Candied Witch", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    // Simulate already-earned level 2.
    const hs = s.hirelingStates.get("Candied Witch-3")!;
    const states = new Map(s.hirelingStates);
    states.set("Candied Witch-3", { ...hs, bewitchLevel: 2 });
    s = { ...s, hirelingStates: states };
    // Add two customers.
    s = addCustomer(s, makeCustomer({ id: "c1" }));
    s = addCustomer(s, makeCustomer({ id: "c2" }));
    s = tick(s, 6, mulberry32(1));
    expect(s.customers[0].bewitchedByIds).toContain("Candied Witch-3");
    expect(s.customers[1].bewitchedByIds).toContain("Candied Witch-3");
    const bewitch = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "bewitch" }> =>
        e.kind === "bewitch"
    );
    expect(bewitch!.customerIds.length).toBe(2);
  });

  test("a non-Bewitch hireling never emits a bewitch log entry", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Doughboy", "love"); // no Bewitch
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer());
    s = tick(s, 6, mulberry32(1));
    expect(s.log.some((e) => e.kind === "bewitch")).toBe(false);
    expect(s.customers[0].bewitchedByIds).toEqual([]);
  });

  test("Bewitch does nothing when there are no unresolved customers", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Candied Witch", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    // No customers added.
    s = tick(s, 6, mulberry32(1));
    expect(s.log.some((e) => e.kind === "bewitch")).toBe(false);
  });

  test("The Queen: Bewitch + per-cast rep grant both fire on the same cast", () => {
    // Queen has the Bewitch keyword AND an applyPostCastAbility clause
    // (+1 rep to every unresolved customer per cast). Both effects must
    // fire in the same cast — independently wired, both observable.
    let b = createBoard();
    b = placeAt(b, 3, "The Queen", "love"); // 9s cast
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(
      s,
      makeCustomer({ patienceSeconds: 15, reputationStars: 2 })
    );
    s = tick(s, 10, mulberry32(1));
    // Bewitch: customer tagged + focus burst.
    expect(s.customers[0].bewitchedByIds).toContain("The Queen-3");
    expect(s.customers[0].axes.focus.playerFill).toBeGreaterThanOrEqual(
      BEWITCH_FOCUS_BURST
    );
    // Queen's post-cast rep bump: 2 → 3.
    expect(s.customers[0].customer.reputationStars).toBe(3);
    // Both a `bewitch` and no ability-buff entry specifically from Queen,
    // since her +1 rep mutates customer state rather than emitting a
    // buff log line. The bewitch log is enough to verify the keyword path.
    expect(s.log.some((e) => e.kind === "bewitch" && e.casterId === "The Queen-3")).toBe(true);
  });
});

describe("Bewitch-reactive hirelings (Phase 2)", () => {
  test("Lady's Maid: Bewitch success buffs a random ally +1 permanent potency", () => {
    let b = createBoard();
    b = placeAt(b, 2, "Doughboy", "love");        // candidate ally
    b = placeAt(b, 3, "Lady's Maid", "love");      // 4s cast, Bewitch
    b = placeAt(b, 4, "Pantry Stocker", "love");  // candidate ally
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer());
    s = tick(s, 5, mulberry32(1));
    // Maid herself is excluded; one of the two allies got +1 potency.
    const dough = s.hirelingStates.get("Doughboy-2")!;
    const stocker = s.hirelingStates.get("Pantry Stocker-4")!;
    const maid = s.hirelingStates.get("Lady's Maid-3")!;
    expect(maid.permanentPotencyGainedThisRound).toBe(0);
    const total = dough.permanentPotencyGainedThisRound +
                  stocker.permanentPotencyGainedThisRound;
    expect(total).toBe(1);
  });

  test("Knight Errant: +3 permanent potency when the Bewitched customer has 3+ stars", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Knight Errant", "love"); // 6s cast
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer({ id: "high", reputationStars: 4 }));
    s = tick(s, 7, mulberry32(1));
    const ke = s.hirelingStates.get("Knight Errant-3")!;
    expect(ke.permanentPotencyGainedThisRound).toBe(3);
  });

  test("Knight Errant: no +3 buff when the Bewitched customer has < 3 stars", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Knight Errant", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer({ id: "low", reputationStars: 2 }));
    s = tick(s, 7, mulberry32(1));
    const ke = s.hirelingStates.get("Knight Errant-3")!;
    expect(ke.permanentPotencyGainedThisRound).toBe(0);
  });

  test("Part-Time Potioneer: +2 permanent potency on Bewitch success", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Part-Time Potioneer", "love"); // 6s cast
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer());
    s = tick(s, 7, mulberry32(1));
    const ptp = s.hirelingStates.get("Part-Time Potioneer-3")!;
    expect(ptp.permanentPotencyGainedThisRound).toBe(2);
  });

  test("The Squire: +3 permanent potency only when Knight Errant is on board AND customer has 3+ stars", () => {
    // No Knight Errant — Squire gets nothing.
    let bAlone = createBoard();
    bAlone = placeAt(bAlone, 3, "The Squire", "love"); // 5s cast
    let sAlone = initializeActionState(bAlone, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    sAlone = addCustomer(sAlone, makeCustomer({ reputationStars: 5 }));
    sAlone = tick(sAlone, 6, mulberry32(1));
    expect(sAlone.hirelingStates.get("The Squire-3")!.permanentPotencyGainedThisRound).toBe(0);

    // With Knight Errant active + high-rep customer → Squire gains +3.
    let b = createBoard();
    b = placeAt(b, 2, "Knight Errant", "love");
    b = placeAt(b, 3, "The Squire", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer({ reputationStars: 4 }));
    s = tick(s, 6, mulberry32(1));
    expect(s.hirelingStates.get("The Squire-3")!.permanentPotencyGainedThisRound).toBe(3);
  });

  test("Champion Knight: targets only the highest-rep customer, then buffs Nobles allies on buy", () => {
    let b = createBoard();
    b = placeAt(b, 1, "The Page", "luck");                // Nobles, won't sell (different potion)
    b = placeAt(b, 3, "The Champion Knight", "love");     // 7s cast, Bewitch
    b = placeAt(b, 5, "Doughboy", "love");                // Sugar — not buffed
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 5);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    // Two customers; the higher-rep one is target.
    s = addCustomer(s, makeCustomer({ id: "low", reputationStars: 2, patienceSeconds: 12, budget: 20, qualityThreshold: 1 }));
    s = addCustomer(s, makeCustomer({ id: "high", reputationStars: 5, patienceSeconds: 12, budget: 20, qualityThreshold: 1 }));
    s = tick(s, 12, mulberry32(1));
    // Only the 5-star customer should be tagged by Champion Knight.
    expect(s.customers[0].bewitchedByIds).not.toContain("The Champion Knight-3");
    expect(s.customers[1].bewitchedByIds).toContain("The Champion Knight-3");
    // Once that tagged customer resolves+buys, Nobles allies (The Page) get +2.
    const page = s.hirelingStates.get("The Page-1")!;
    const dough = s.hirelingStates.get("Doughboy-5")!;
    expect(page.permanentPotencyGainedThisRound).toBe(2);
    expect(dough.permanentPotencyGainedThisRound).toBe(0);
  });

  test("The Prince: targets highest-rep, then +3 self / +1 Nobles allies on buy", () => {
    let b = createBoard();
    b = placeAt(b, 1, "The Page", "luck");
    b = placeAt(b, 3, "The Prince", "love"); // 9s cast
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 5);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(s, makeCustomer({ id: "high", reputationStars: 5, patienceSeconds: 14, budget: 20, qualityThreshold: 1 }));
    s = tick(s, 14, mulberry32(1));
    const prince = s.hirelingStates.get("The Prince-3")!;
    const page = s.hirelingStates.get("The Page-1")!;
    expect(prince.permanentPotencyGainedThisRound).toBe(3);
    expect(page.permanentPotencyGainedThisRound).toBe(1);
  });

  test("Masked Minstrel: gains +3 permanent stock instead of gold when Bewitched customer buys", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Masked Minstrel", "love"); // 6s cast, Knockoff x2 + Bewitch + Haggle
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 3);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(s, makeCustomer({ patienceSeconds: 12, reputationStars: 2, budget: 20, qualityThreshold: 1 }));
    s = tick(s, 12, mulberry32(1));
    const mm = s.hirelingStates.get("Masked Minstrel-3")!;
    // Sale fired with Masked Minstrel as seller; gold from that sale
    // should be REVERSED, and +3 permanent stock granted (on top of
    // Knockoff x2 from the same sale).
    expect(mm.unitsSoldThisRound).toBeGreaterThan(0);
    expect(mm.permanentStockGainedThisRound).toBeGreaterThanOrEqual(3);
    // Gold should be 0 (or reversed back to baseline) since the
    // "instead of gold" clause cancels out the sale's gold income.
    expect(s.gold).toBe(0);
  });
});
