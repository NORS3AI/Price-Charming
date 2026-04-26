import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { Board } from "../board/types";
import { Customer } from "../customers/types";
import { mulberry32 } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { defaultPriceMap, setPrice, buildPricingPanel } from "../pricing/panel";
import { addCustomer, initializeActionState, tick } from "../action/state";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    desiredType: "love",
    budget: 5,
    qualityThreshold: 1,
    reputationStars: 3,
    patienceSeconds: 8,
    axisPriority: ["focus", "type", "budget", "quality"],
    ...overrides,
  };
}

describe("Dual-potion data model (Phase 5)", () => {
  test("a hireling with two potion slots sells from BOTH on demand", () => {
    // Pickpocket Pixie: P1 stock 2 / pot 2; P2 stock 2 / pot 3.
    const card = ALL_HIRELINGS.find((h) => h.name === "Pickpocket Pixie")!;
    expect(card.potions.length).toBe(2);
    const inst = createHirelingInstance(card, "pp", "love", { potionType2: "luck" });

    let b = createBoard();
    b = placeHireling(b, 3, inst);
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 5);
    prices = setPrice(prices, "luck", 1, 5);

    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);

    // Customer wanting LOVE (slot 0).
    s = addCustomer(s, makeCustomer({ id: "c-love", desiredType: "love" }));
    s = tick(s, 4, mulberry32(1));
    const ppHs1 = s.hirelingStates.get("pp")!;
    expect(ppHs1.unitsSoldThisRound).toBeGreaterThanOrEqual(1);
    expect(ppHs1.unitsSoldThisRound2).toBe(0);

    // Now a customer wanting LUCK (slot 1).
    s = addCustomer(s, makeCustomer({ id: "c-luck", desiredType: "luck" }));
    s = tick(s, 4, mulberry32(1));
    const ppHs2 = s.hirelingStates.get("pp")!;
    expect(ppHs2.unitsSoldThisRound2).toBeGreaterThanOrEqual(1);
  });

  test("pricing panel sums BOTH slot contributions per potion type", () => {
    // Two Pickpocket Pixies: one assigned love+luck, one assigned love+flutterfix.
    // Slot 0 contributes to "love" (twice). Slot 1 contributes to luck once
    // and flutterfix once.
    const card = ALL_HIRELINGS.find((h) => h.name === "Pickpocket Pixie")!;
    let b = createBoard();
    b = placeHireling(b, 2, createHirelingInstance(card, "pp1", "love", { potionType2: "luck" }));
    b = placeHireling(b, 3, createHirelingInstance(card, "pp2", "love", { potionType2: "flutterfix" }));

    const rows = buildPricingPanel(ACTIVE, b, defaultPriceMap(ACTIVE));
    const love = rows.find((r) => r.potionType === "love")!;
    const luck = rows.find((r) => r.potionType === "luck")!;
    const flutter = rows.find((r) => r.potionType === "flutterfix")!;
    // Love: slot 0 of both pixies (stock 2, pot 2 each) → combined 4/4.
    expect(love.combinedStock).toBe(4);
    expect(love.combinedPotency).toBe(4);
    // Luck: slot 1 of pp1 only (stock 2, pot 3) → combined 2/3.
    expect(luck.combinedStock).toBe(2);
    expect(luck.combinedPotency).toBe(3);
    // Flutterfix: slot 1 of pp2 only.
    expect(flutter.combinedStock).toBe(2);
    expect(flutter.combinedPotency).toBe(3);
  });

  test("permanentStockBonus2 / permanentPotencyBonus2 carry across rounds", () => {
    // Synthetic: instantiate with non-zero bonuses on both slots and
    // confirm pricing reflects the total.
    const card = ALL_HIRELINGS.find((h) => h.name === "Pickpocket Pixie")!;
    const inst = createHirelingInstance(card, "buffed", "love", {
      potionType2: "luck",
      permanentStockBonus: 5,
      permanentStockBonus2: 7,
      permanentPotencyBonus: 1,
      permanentPotencyBonus2: 3,
    });
    let b = createBoard();
    b = placeHireling(b, 3, inst);
    const rows = buildPricingPanel(ACTIVE, b, defaultPriceMap(ACTIVE));
    const love = rows.find((r) => r.potionType === "love")!;
    const luck = rows.find((r) => r.potionType === "luck")!;
    // Slot 0: base 2 + 5 = 7 stock; base 2 + 1 = 3 potency.
    expect(love.combinedStock).toBe(7);
    expect(love.combinedPotency).toBe(3);
    // Slot 1: base 2 + 7 = 9 stock; base 3 + 3 = 6 potency.
    expect(luck.combinedStock).toBe(9);
    expect(luck.combinedPotency).toBe(6);
  });
});
