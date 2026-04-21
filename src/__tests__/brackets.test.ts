import {
  CAP_VALUE,
  MAX_PRICE,
  MIN_PRICE,
  PRICE_BRACKETS,
  amountToNextBracket,
  maxPriceForStatValue,
} from "../pricing/brackets";

describe("price brackets", () => {
  test("table matches the spec exactly", () => {
    expect([...PRICE_BRACKETS]).toEqual([
      { minValue: 1, maxPrice: 1 },
      { minValue: 9, maxPrice: 2 },
      { minValue: 17, maxPrice: 3 },
      { minValue: 25, maxPrice: 4 },
      { minValue: 33, maxPrice: 5 },
      { minValue: 41, maxPrice: 6 },
      { minValue: 51, maxPrice: 7 },
      { minValue: 63, maxPrice: 8 },
    ]);
    expect(MIN_PRICE).toBe(1);
    expect(MAX_PRICE).toBe(8);
    expect(CAP_VALUE).toBe(63);
  });

  test("PRICE_BRACKETS is frozen at runtime", () => {
    expect(Object.isFrozen(PRICE_BRACKETS)).toBe(true);
  });
});

describe("maxPriceForStatValue", () => {
  test("returns 0 when no hireling sells the type", () => {
    expect(maxPriceForStatValue(0)).toBe(0);
    expect(maxPriceForStatValue(-3)).toBe(0);
  });

  test("matches each bracket boundary exactly", () => {
    // Spec table: lower bound and upper bound of each bracket.
    // Value = max(combined stock, combined potency).
    expect(maxPriceForStatValue(1)).toBe(1);
    expect(maxPriceForStatValue(8)).toBe(1);
    expect(maxPriceForStatValue(9)).toBe(2);
    expect(maxPriceForStatValue(16)).toBe(2);
    expect(maxPriceForStatValue(17)).toBe(3);
    expect(maxPriceForStatValue(24)).toBe(3);
    expect(maxPriceForStatValue(25)).toBe(4);
    expect(maxPriceForStatValue(32)).toBe(4);
    expect(maxPriceForStatValue(33)).toBe(5);
    expect(maxPriceForStatValue(40)).toBe(5);
    expect(maxPriceForStatValue(41)).toBe(6);
    expect(maxPriceForStatValue(50)).toBe(6);
    expect(maxPriceForStatValue(51)).toBe(7);
    expect(maxPriceForStatValue(62)).toBe(7);
    expect(maxPriceForStatValue(63)).toBe(8);
    expect(maxPriceForStatValue(99)).toBe(8);
  });
});

describe("amountToNextBracket", () => {
  test("counts down to the next boundary", () => {
    expect(amountToNextBracket(1)).toBe(8); // need 8 more to reach 9
    expect(amountToNextBracket(8)).toBe(1); // 1 short of bracket 9-16
    expect(amountToNextBracket(16)).toBe(1); // 1 short of bracket 17-24
    expect(amountToNextBracket(50)).toBe(1); // 1 short of 51-62
    expect(amountToNextBracket(62)).toBe(1); // 1 short of cap at 63
  });

  test("returns null at the cap", () => {
    expect(amountToNextBracket(63)).toBeNull();
    expect(amountToNextBracket(150)).toBeNull();
  });

  test("handles 0 / negative by reporting distance to the first bracket", () => {
    expect(amountToNextBracket(0)).toBe(1);
    expect(amountToNextBracket(-5)).toBe(6);
  });
});
