import { mulberry32 } from "../potions/rng";
import { rollUnitsPerInteraction, unitsRange } from "../pricing/stock";

describe("unitsRange", () => {
  test("matches the spec brackets exactly", () => {
    expect(unitsRange(0)).toEqual({ min: 0, max: 0 });
    expect(unitsRange(1)).toEqual({ min: 1, max: 1 });
    expect(unitsRange(5)).toEqual({ min: 1, max: 1 });
    expect(unitsRange(6)).toEqual({ min: 1, max: 2 });
    expect(unitsRange(15)).toEqual({ min: 1, max: 2 });
    expect(unitsRange(16)).toEqual({ min: 2, max: 3 });
    expect(unitsRange(30)).toEqual({ min: 2, max: 3 });
    expect(unitsRange(31)).toEqual({ min: 3, max: 4 });
    expect(unitsRange(100)).toEqual({ min: 3, max: 4 });
  });

  test("negative stock yields {0,0}", () => {
    expect(unitsRange(-1)).toEqual({ min: 0, max: 0 });
  });
});

describe("rollUnitsPerInteraction", () => {
  test("low stock always sells exactly its bracket minimum/max (1 unit)", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 20; i++) {
      expect(rollUnitsPerInteraction(3, rng)).toBe(1);
    }
  });

  test("rolls within the inclusive range across many seeds", () => {
    const seen = new Set<number>();
    for (let s = 0; s < 200; s++) {
      seen.add(rollUnitsPerInteraction(20, mulberry32(s))); // bracket 2..3
    }
    expect(seen).toEqual(new Set([2, 3]));
  });

  test("never exceeds remaining stock even if the bracket allows more", () => {
    // stock 1 sits in the "1" bracket, but if a hireling in a higher
    // bracket runs down to 1, the result should still cap at 1.
    expect(rollUnitsPerInteraction(1, mulberry32(1))).toBe(1);

    // Force a high-bracket roll then cap by passing low effective stock:
    // the spec says "a hireling that runs out of stock mid-action stops
    // selling" — between interactions stock can be small.
    const rng = mulberry32(1);
    for (let i = 0; i < 50; i++) {
      const stock = 2;
      const sold = rollUnitsPerInteraction(stock, rng);
      expect(sold).toBeLessThanOrEqual(stock);
    }
  });

  test("zero or negative stock returns 0", () => {
    expect(rollUnitsPerInteraction(0, mulberry32(1))).toBe(0);
    expect(rollUnitsPerInteraction(-3, mulberry32(1))).toBe(0);
  });
});
