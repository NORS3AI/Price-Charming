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
