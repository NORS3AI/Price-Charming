import { ALL_HIRELINGS } from "../cards/hirelings";
import { createHirelingInstance } from "../board/hand";
import {
  PASSIVE_RATES,
  computePassiveContribution,
  contributionToAxes,
  overBudgetPressure,
} from "../customers/contributions";
import { Customer } from "../customers/types";

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    desiredType: "love",
    budget: 3,
    qualityThreshold: 3,
    reputationStars: 2,
    patienceSeconds: 10,
    axisPriority: ["focus", "type", "budget", "quality"],
    ...overrides,
  };
}

function hireling(name: string, potion: string) {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  return createHirelingInstance(card, `${name}-1`, potion as any);
}

describe("computePassiveContribution", () => {
  test("matching type with fitting price and meeting quality fills all four axes", () => {
    // Sugar Sprinkler: potency 5 (no stock printed = 0 per CSV → Focus 0)
    // Use Pantry Stocker (stock 2, potency 3) with threshold 3 to cover quality.
    const inst = hireling("Pantry Stocker", "love");
    const contrib = computePassiveContribution(inst, 2, makeCustomer());
    expect(contrib.type).toBe(PASSIVE_RATES.typeMatchPerSecond);
    expect(contrib.focus).toBe(2 * PASSIVE_RATES.focusPerStock);
    expect(contrib.budget).toBe(PASSIVE_RATES.budgetFitPerSecond);
    expect(contrib.quality).toBe(3 * PASSIVE_RATES.qualityPerPotency);
  });

  test("wrong potion type yields zero on every axis", () => {
    const inst = hireling("Pantry Stocker", "luck");
    const contrib = computePassiveContribution(inst, 2, makeCustomer()); // love
    expect(contrib).toEqual({ focus: 0, type: 0, budget: 0, quality: 0 });
  });

  test("over-budget kills the budget axis contribution", () => {
    const inst = hireling("Pantry Stocker", "love");
    // price 5 > budget 3
    const contrib = computePassiveContribution(inst, 5, makeCustomer({ budget: 3 }));
    expect(contrib.budget).toBe(0);
  });

  test("potency below the quality threshold kills the quality axis", () => {
    const inst = hireling("Pantry Stocker", "love"); // potency 3
    const contrib = computePassiveContribution(
      inst,
      2,
      makeCustomer({ qualityThreshold: 10 })
    );
    expect(contrib.quality).toBe(0);
  });
});

describe("overBudgetPressure", () => {
  test("returns 0 when type mismatches", () => {
    const inst = hireling("Pantry Stocker", "luck");
    expect(overBudgetPressure(inst, 10, makeCustomer())).toBe(0);
  });

  test("returns 0 when price fits budget", () => {
    const inst = hireling("Pantry Stocker", "love");
    expect(overBudgetPressure(inst, 3, makeCustomer({ budget: 3 }))).toBe(0);
  });

  test("returns the over-budget rate when price exceeds budget", () => {
    const inst = hireling("Pantry Stocker", "love");
    expect(overBudgetPressure(inst, 5, makeCustomer({ budget: 3 }))).toBe(
      PASSIVE_RATES.budgetOverPerSecond
    );
  });
});

describe("contributionToAxes", () => {
  test("reshapes into a keyed record", () => {
    const inst = hireling("Pantry Stocker", "love");
    const contrib = computePassiveContribution(inst, 2, makeCustomer());
    const asAxes = contributionToAxes(contrib);
    expect(asAxes.focus).toBe(contrib.focus);
    expect(asAxes.type).toBe(contrib.type);
    expect(asAxes.budget).toBe(contrib.budget);
    expect(asAxes.quality).toBe(contrib.quality);
  });
});

describe("PASSIVE_RATES", () => {
  test("is frozen at runtime", () => {
    expect(Object.isFrozen(PASSIVE_RATES)).toBe(true);
  });
});
