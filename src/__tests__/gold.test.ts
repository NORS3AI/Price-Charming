import {
  STARTING_GOLD,
  COST_HIRELING,
  COST_SPELL,
  COST_REFRESH,
  SELL_VALUE,
  canAfford,
} from "../economy/gold";

describe("gold economy constants", () => {
  test("match the spec", () => {
    expect(STARTING_GOLD).toBe(5);
    expect(COST_HIRELING).toBe(2);
    expect(COST_SPELL).toBe(2);
    expect(COST_REFRESH).toBe(1);
    expect(SELL_VALUE).toBe(1);
  });
});

describe("canAfford", () => {
  test("true when gold >= cost, inclusive", () => {
    expect(canAfford(4, 4)).toBe(true);
    expect(canAfford(10, 4)).toBe(true);
  });
  test("false when gold < cost", () => {
    expect(canAfford(3, 4)).toBe(false);
    expect(canAfford(0, 1)).toBe(false);
  });
  test("free actions always afford (cost 0)", () => {
    expect(canAfford(0, 0)).toBe(true);
  });
});
