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
} from "../action/state";
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
  return placeHireling(
    b,
    slot,
    createHirelingInstance(card, `${name}-${slot}`, potion)
  );
}

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    desiredType: "love",
    budget: 5,
    qualityThreshold: 3,
    reputationStars: 3,
    patienceSeconds: 10,
    axisPriority: ["focus", "type", "budget", "quality"],
    ...overrides,
  };
}

describe("addCustomer", () => {
  test("appends a fresh CustomerState and logs arrival", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker", "love");
    const s0 = initializeActionState(
      b,
      defaultPriceMap(ACTIVE),
      ACTIVE,
      mulberry32(1),
      5,
      0
    );
    const s1 = addCustomer(s0, makeCustomer());
    expect(s1.customers).toHaveLength(1);
    expect(s1.customers[0].customer.id).toBe("c1");
    expect(s1.customers[0].resolvedFor).toBeNull();
    const arrival = s1.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "customer-arrived" }> =>
        e.kind === "customer-arrived"
    );
    expect(arrival).toEqual({
      kind: "customer-arrived",
      customerId: "c1",
      atSeconds: 0,
    });
  });
});

describe("tick — passive contributions + resolution", () => {
  test("a matching-type Pantry Stocker passively fills all four axes and wins the customer", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker", "love"); // potency 3, stock 2
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer({ patienceSeconds: 5 }));

    s = tick(s, 5, mulberry32(1));

    const cs = s.customers[0];
    expect(cs.resolvedFor).toBe("player");
    const logged = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "customer-resolved" }> =>
        e.kind === "customer-resolved"
    );
    expect(logged?.resolution).toBe("player");
  });

  test("wrong-type hirelings never contribute and the customer walks away (no-sale)", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker", "luck"); // wrong type for a Love-wanting customer
    const s0 = initializeActionState(
      b,
      defaultPriceMap(ACTIVE),
      ACTIVE,
      mulberry32(1)
    );
    let s = addCustomer(s0, makeCustomer({ patienceSeconds: 4 }));
    s = tick(s, 4, mulberry32(1));
    expect(s.customers[0].resolvedFor).toBe("no-sale");
  });

  test("over-budget set price kills the Budget axis even with matching type", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker", "love");
    let prices = defaultPriceMap(ACTIVE);
    // Board only has 3 potency in slot 1 → max 1g; force the price to
    // be at the cap so Budget contribution is 0 (price > customer.budget).
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1));
    s = addCustomer(
      s,
      makeCustomer({ patienceSeconds: 3, budget: 0 }) // impossible budget
    );
    s = tick(s, 3, mulberry32(1));
    const cs = s.customers[0];
    // Budget axis never filled (over-budget): playerFill should be 0.
    expect(cs.axes.budget.playerFill).toBe(0);
    // But other axes still filled, so the customer should still resolve for player.
    expect(cs.resolvedFor).toBe("player");
  });

  test("a resolved customer is not touched on subsequent ticks", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker", "love");
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer({ patienceSeconds: 2 }));
    s = tick(s, 2, mulberry32(1));
    const resolvedSnapshot = s.customers[0];
    s = tick(s, 10, mulberry32(1));
    // Same object — no further mutation after resolution.
    expect(s.customers[0]).toBe(resolvedSnapshot);
  });

  test("a never-matched customer resolves as no-sale when nobody contributes", () => {
    // Empty active board — no contributors at all.
    let s = initializeActionState(
      createBoard(),
      defaultPriceMap(ACTIVE),
      ACTIVE,
      mulberry32(1)
    );
    s = addCustomer(s, makeCustomer({ patienceSeconds: 1 }));
    s = tick(s, 1, mulberry32(1));
    expect(s.customers[0].resolvedFor).toBe("no-sale");
  });
});

describe("sale execution", () => {
  test("player win drives a sale: units, gold, reputation, stock consumed", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker", "love"); // stock 2, potency 3
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(
      b,
      prices,
      ACTIVE,
      mulberry32(1),
      /*gold*/ 0,
      /*rep*/ 0
    );
    s = addCustomer(s, makeCustomer({ patienceSeconds: 3, reputationStars: 4 }));
    s = tick(s, 3, mulberry32(1));

    const sale = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "sale" }> => e.kind === "sale"
    );
    expect(sale).toBeDefined();
    expect(sale!.instanceId).toBe("Pantry Stocker-3");
    expect(sale!.unitsSold).toBeGreaterThanOrEqual(1);
    expect(sale!.unitsSold).toBeLessThanOrEqual(2);
    expect(sale!.pricePerUnit).toBe(1);
    expect(sale!.goldEarned).toBe(sale!.unitsSold * 1);
    expect(sale!.haggled).toBe(false);
    expect(sale!.reputationDelta).toBe(4);
    expect(s.gold).toBe(sale!.goldEarned);
    expect(s.reputation).toBe(4);

    const hs = s.hirelingStates.get("Pantry Stocker-3")!;
    expect(hs.unitsSoldThisRound).toBe(sale!.unitsSold);
  });

  test("Haggle sale bumps price by 3g and costs -1 reputation", () => {
    let b = createBoard();
    // Almost-A-Knight carries Haggle, potency 3, stock 4.
    b = placeAt(b, 3, "Almost-A-Knight", "love");
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(
      b,
      prices,
      ACTIVE,
      mulberry32(1),
      0,
      0
    );
    s = addCustomer(
      s,
      makeCustomer({ patienceSeconds: 3, reputationStars: 3, budget: 20 })
    );
    s = tick(s, 3, mulberry32(1));
    const sale = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "sale" }> => e.kind === "sale"
    )!;
    expect(sale.haggled).toBe(true);
    expect(sale.pricePerUnit).toBe(1 + 3);
    expect(sale.reputationDelta).toBe(2); // 3 stars - 1 Haggle penalty
    expect(s.reputation).toBe(2);
  });

  test("Knockoff triggers after sale when potency < 10", () => {
    let b = createBoard();
    // Robbin Goblin: Knockoff x1, potency 2 (< 10).
    b = placeAt(b, 3, "Robbin Goblin", "love");
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(
      s,
      makeCustomer({ patienceSeconds: 3, budget: 20, qualityThreshold: 1 })
    );
    s = tick(s, 3, mulberry32(1));

    const knockoff = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "knockoff" }> =>
        e.kind === "knockoff"
    );
    expect(knockoff?.stockGained).toBe(1);
    const hs = s.hirelingStates.get("Robbin Goblin-3")!;
    expect(hs.permanentStockGainedThisRound).toBe(1);
  });

  test("passive contributions cap at patience remaining (no over-application mid-tick)", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker", "love"); // potency 3, stock 2
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    // Customer has 2s patience. If the tick is 10s, we should only
    // apply 2s of contributions before expiring, not 10s.
    s = addCustomer(
      s,
      makeCustomer({ patienceSeconds: 2, qualityThreshold: 3 })
    );
    s = tick(s, 10, mulberry32(1));
    const cs = s.customers[0];
    expect(cs.resolvedFor).toBe("player");
    // Quality axis: 3 potency × 1.0/s × 2s = 6 (cap at 100). If we had
    // over-applied, playerFill would be 30 instead.
    expect(cs.axes.quality.playerFill).toBeCloseTo(6);
  });

  test("customer desiredUnits raises the sale floor when stock allows (regression)", () => {
    let b = createBoard();
    // Pantry Stocker has 2 base stock; customer wants 2 units.
    b = placeAt(b, 3, "Pantry Stocker", "love");
    let prices = setPrice(defaultPriceMap(ACTIVE), "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(
      s,
      makeCustomer({
        patienceSeconds: 3,
        reputationStars: 3,
        budget: 20,
        qualityThreshold: 1,
        desiredUnits: 2,
      })
    );
    s = tick(s, 3, mulberry32(1));
    const sale = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "sale" }> => e.kind === "sale"
    );
    expect(sale).toBeDefined();
    expect(sale!.unitsSold).toBe(2);
    expect(sale!.goldEarned).toBe(2);
  });

  test("Jumping Jack grants +1 permanent stock and +1 permanent potency per sale", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Jumping Jack", "love"); // ability: self +1/+1 on sale
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(
      s,
      makeCustomer({ patienceSeconds: 3, reputationStars: 2, budget: 20, qualityThreshold: 1 })
    );
    s = tick(s, 3, mulberry32(1));
    const jj = s.hirelingStates.get("Jumping Jack-3")!;
    expect(jj.permanentStockGainedThisRound).toBeGreaterThan(0);
    expect(jj.permanentPotencyGainedThisRound).toBeGreaterThan(0);
    const buffLog = s.log.find(
      (e) => e.kind === "ability-buff" && e.casterId === "Jumping Jack-3"
    );
    expect(buffLog).toBeDefined();
  });

  test("Confectioner: after any sale, all Sugar Guild allies gain +1 permanent potency", () => {
    let b = createBoard();
    b = placeAt(b, 2, "Doughboy", "love");        // Sugar ally — should be buffed
    b = placeAt(b, 3, "Confectioner", "love");    // Sugar, 7s cast, Haggle
    b = placeAt(b, 5, "Jumping Jack", "luck");    // No Guild + different potion
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 5);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    // Tick 8s so Confectioner casts once and has +4 temp stock for the sale.
    s = tick(s, 8, mulberry32(1));
    s = addCustomer(
      s,
      makeCustomer({ patienceSeconds: 5, reputationStars: 2, budget: 20, qualityThreshold: 1 })
    );
    s = tick(s, 5, mulberry32(1));
    const doughHs = s.hirelingStates.get("Doughboy-2")!;
    const jjHs = s.hirelingStates.get("Jumping Jack-5")!;
    const selfHs = s.hirelingStates.get("Confectioner-3")!;
    // Sugar Guild ally gets +1 potency; non-Sugar ally does not; self does not.
    expect(doughHs.permanentPotencyGainedThisRound).toBe(1);
    expect(jjHs.permanentPotencyGainedThisRound).toBe(0);
    expect(selfHs.permanentPotencyGainedThisRound).toBe(0);
  });

  test("Gingerbread King: gains +2 potency whenever any ally sells", () => {
    let b = createBoard();
    b = placeAt(b, 2, "Jumping Jack", "love");       // base stock 3, 5s cast
    b = placeAt(b, 3, "Gingerbread King", "luck");   // different potion — won't sell
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(
      s,
      makeCustomer({ patienceSeconds: 3, reputationStars: 2, budget: 20, qualityThreshold: 1 })
    );
    s = tick(s, 3, mulberry32(1));
    const gk = s.hirelingStates.get("Gingerbread King-3")!;
    expect(gk.permanentPotencyGainedThisRound).toBe(2);
    // Jumping Jack sold — it gets its own +1/+1 self-buff, but NOT
    // Gingerbread King's ally buff (its own sale doesn't reflect back).
    const jj = s.hirelingStates.get("Jumping Jack-2")!;
    expect(jj.permanentPotencyGainedThisRound).toBe(1);
  });

  test("Street Rat: +2 permanent stock only on Haggled sales", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Street Rat", "love"); // Haggle + Knockoff x2
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 5);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    // Customer budget must accommodate haggled price (5 + 3 = 8).
    s = addCustomer(
      s,
      makeCustomer({ patienceSeconds: 3, reputationStars: 2, budget: 20, qualityThreshold: 1 })
    );
    s = tick(s, 3, mulberry32(1));
    const sr = s.hirelingStates.get("Street Rat-3")!;
    // +2 from Street Rat's own Haggle-buff, plus Knockoff x2 (potency is low).
    expect(sr.permanentStockGainedThisRound).toBeGreaterThanOrEqual(2);
    // Log has an ability-buff entry for the +2 stock.
    const streetRatBuff = s.log.find(
      (e) => e.kind === "ability-buff" &&
             e.casterId === "Street Rat-3" &&
             e.targetId === "Street Rat-3" &&
             e.stockGained === 2
    );
    expect(streetRatBuff).toBeDefined();
  });

  test("Burnt Batch: gains +6 permanent potency at end of round if it sold nothing", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Burnt Batch", "love"); // 3s cast, Quickcraft x2
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    // No customers — tick a while, then finalize.
    s = tick(s, 10, mulberry32(1));
    const { finalizeRound, applyEndOfRoundHooks } = require("../action/state");
    const fin = applyEndOfRoundHooks(finalizeRound(s));
    const bb = fin.hirelingStates.get("Burnt Batch-3")!;
    expect(bb.permanentPotencyGainedThisRound).toBe(6);
  });

  test("Burnt Batch: no +6 buff if it sold anything", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Burnt Batch", "love"); // Quickcraft x2 — generates temp stock
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(
      s,
      makeCustomer({ patienceSeconds: 10, reputationStars: 2, budget: 20, qualityThreshold: 1 })
    );
    // 3s cast → at least one Quickcraft fires, then the customer resolves.
    s = tick(s, 12, mulberry32(1));
    const { finalizeRound, applyEndOfRoundHooks } = require("../action/state");
    const fin = applyEndOfRoundHooks(finalizeRound(s));
    const bb = fin.hirelingStates.get("Burnt Batch-3")!;
    // Sold at least one unit → no end-of-round buff.
    expect(bb.unitsSoldThisRound).toBeGreaterThan(0);
    expect(bb.permanentPotencyGainedThisRound).toBe(0);
  });

  test("Glazier: gains +3 permanent potency if total Quickcraft stock generated > 10", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Glazier", "love"); // 6s cast, Quickcraft x4
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    // 3 casts @ 6s = 18s; 3 × 4 = 12 Quickcraft stock generated > 10.
    s = tick(s, 19, mulberry32(1));
    const { finalizeRound, applyEndOfRoundHooks } = require("../action/state");
    const fin = applyEndOfRoundHooks(finalizeRound(s));
    const gl = fin.hirelingStates.get("Glazier-3")!;
    expect(gl.permanentPotencyGainedThisRound).toBe(3);
  });

  test("Glazier: no +3 buff when Quickcraft-generated total is 10 or under", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Glazier", "love");
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    // 2 casts @ 6s = 12s; 2 × 4 = 8 Quickcraft stock — not > 10.
    s = tick(s, 13, mulberry32(1));
    const { finalizeRound, applyEndOfRoundHooks } = require("../action/state");
    const fin = applyEndOfRoundHooks(finalizeRound(s));
    const gl = fin.hirelingStates.get("Glazier-3")!;
    expect(gl.permanentPotencyGainedThisRound).toBe(0);
  });

  test("no sale happens when no hireling of matching type has stock", () => {
    let b = createBoard();
    // Wrong-type hireling — cannot sell.
    b = placeAt(b, 3, "Pantry Stocker", "luck");
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 8);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(s, makeCustomer({ patienceSeconds: 2 }));
    s = tick(s, 2, mulberry32(1));
    expect(s.customers[0].resolvedFor).toBe("no-sale");
    expect(s.gold).toBe(0);
    expect(s.reputation).toBe(0);
    expect(s.log.some((e) => e.kind === "sale")).toBe(false);
  });
});
