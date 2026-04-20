import {
  CAP_POTENCY,
  MAX_PRICE,
  MIN_PRICE,
  PRICE_BRACKETS,
  maxPriceForPotency,
  potencyToNextBracket,
} from "../pricing/brackets";

describe("price brackets", () => {
  test("table matches the spec exactly", () => {
    expect([...PRICE_BRACKETS]).toEqual([
      { minPotency: 1, maxPrice: 1 },
      { minPotency: 9, maxPrice: 2 },
      { minPotency: 17, maxPrice: 3 },
      { minPotency: 25, maxPrice: 4 },
      { minPotency: 33, maxPrice: 5 },
      { minPotency: 41, maxPrice: 6 },
      { minPotency: 51, maxPrice: 7 },
      { minPotency: 63, maxPrice: 8 },
    ]);
    expect(MIN_PRICE).toBe(1);
    expect(MAX_PRICE).toBe(8);
    expect(CAP_POTENCY).toBe(63);
  });

  test("PRICE_BRACKETS is frozen at runtime", () => {
    expect(Object.isFrozen(PRICE_BRACKETS)).toBe(true);
  });
});

describe("maxPriceForPotency", () => {
  test("returns 0 when no hireling sells the type", () => {
    expect(maxPriceForPotency(0)).toBe(0);
    expect(maxPriceForPotency(-3)).toBe(0);
  });

  test("matches each bracket boundary exactly", () => {
    // Spec table: lower bound and upper bound of each bracket.
    expect(maxPriceForPotency(1)).toBe(1);
    expect(maxPriceForPotency(8)).toBe(1);
    expect(maxPriceForPotency(9)).toBe(2);
    expect(maxPriceForPotency(16)).toBe(2);
    expect(maxPriceForPotency(17)).toBe(3);
    expect(maxPriceForPotency(24)).toBe(3);
    expect(maxPriceForPotency(25)).toBe(4);
    expect(maxPriceForPotency(32)).toBe(4);
    expect(maxPriceForPotency(33)).toBe(5);
    expect(maxPriceForPotency(40)).toBe(5);
    expect(maxPriceForPotency(41)).toBe(6);
    expect(maxPriceForPotency(50)).toBe(6);
    expect(maxPriceForPotency(51)).toBe(7);
    expect(maxPriceForPotency(62)).toBe(7);
    expect(maxPriceForPotency(63)).toBe(8);
    expect(maxPriceForPotency(99)).toBe(8);
  });
});

describe("potencyToNextBracket", () => {
  test("counts down to the next boundary", () => {
    expect(potencyToNextBracket(1)).toBe(8); // need 8 more to reach 9
    expect(potencyToNextBracket(8)).toBe(1); // 1 short of bracket 9-16
    expect(potencyToNextBracket(16)).toBe(1); // 1 short of bracket 17-24
    expect(potencyToNextBracket(50)).toBe(1); // 1 short of 51-62
    expect(potencyToNextBracket(62)).toBe(1); // 1 short of cap at 63
  });

  test("returns null at the cap", () => {
    expect(potencyToNextBracket(63)).toBeNull();
    expect(potencyToNextBracket(150)).toBeNull();
  });

  test("handles 0 / negative by reporting distance to the first bracket", () => {
    expect(potencyToNextBracket(0)).toBe(1);
    expect(potencyToNextBracket(-5)).toBe(6);
  });
});
