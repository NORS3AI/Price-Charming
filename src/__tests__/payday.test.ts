import {
  GLOW_ROUNDS,
  PAYDAY_ROUNDS,
  buildPaydayLineItems,
  isGlowRound,
  isPaydayRound,
  nextPaydayRound,
  paydayIndex,
  roundsUntilPayday,
} from "../economy/payday";
import { MAX_PAYDAYS, createWageTracker, survivePayday } from "../economy/wages";

describe("payday schedule", () => {
  test("payday rounds match spec", () => {
    expect([...PAYDAY_ROUNDS]).toEqual([3, 6, 9, 12, 15]);
    expect([...GLOW_ROUNDS]).toEqual([2, 5, 8, 11, 14]);
  });

  test("PAYDAY_ROUNDS count equals MAX_PAYDAYS", () => {
    expect(PAYDAY_ROUNDS.length).toBe(MAX_PAYDAYS);
  });

  test("each glow round is exactly one round before its payday", () => {
    expect(GLOW_ROUNDS.length).toBe(PAYDAY_ROUNDS.length);
    for (let i = 0; i < PAYDAY_ROUNDS.length; i++) {
      expect(GLOW_ROUNDS[i]).toBe(PAYDAY_ROUNDS[i] - 1);
    }
  });

  test("PAYDAY_ROUNDS and GLOW_ROUNDS are frozen at runtime", () => {
    expect(Object.isFrozen(PAYDAY_ROUNDS)).toBe(true);
    expect(Object.isFrozen(GLOW_ROUNDS)).toBe(true);
    expect(() => (PAYDAY_ROUNDS as number[]).push(18)).toThrow();
  });

  test.each(PAYDAY_ROUNDS)("round %i is a payday", (r) => {
    expect(isPaydayRound(r)).toBe(true);
    expect(isGlowRound(r)).toBe(false);
  });

  test.each(GLOW_ROUNDS)("round %i is a glow round", (r) => {
    expect(isGlowRound(r)).toBe(true);
    expect(isPaydayRound(r)).toBe(false);
  });

  test("non-payday non-glow rounds are neither", () => {
    for (const r of [1, 4, 7, 10, 13]) {
      expect(isPaydayRound(r)).toBe(false);
      expect(isGlowRound(r)).toBe(false);
    }
  });

  test("paydayIndex returns 1..5 for payday rounds, null otherwise", () => {
    expect(paydayIndex(3)).toBe(1);
    expect(paydayIndex(6)).toBe(2);
    expect(paydayIndex(9)).toBe(3);
    expect(paydayIndex(12)).toBe(4);
    expect(paydayIndex(15)).toBe(5);
    expect(paydayIndex(4)).toBeNull();
    expect(paydayIndex(1)).toBeNull();
    expect(paydayIndex(16)).toBeNull();
  });
});

describe("nextPaydayRound / roundsUntilPayday", () => {
  test("counts down toward the next payday", () => {
    expect(nextPaydayRound(1)).toBe(3);
    expect(roundsUntilPayday(1)).toBe(2);
    expect(nextPaydayRound(2)).toBe(3);
    expect(roundsUntilPayday(2)).toBe(1);
    expect(nextPaydayRound(3)).toBe(3);
    expect(roundsUntilPayday(3)).toBe(0);
    expect(nextPaydayRound(4)).toBe(6);
    expect(roundsUntilPayday(4)).toBe(2);
  });

  test("returns null once all paydays are behind us", () => {
    expect(nextPaydayRound(16)).toBeNull();
    expect(roundsUntilPayday(16)).toBeNull();
  });
});

describe("buildPaydayLineItems", () => {
  test("creates one item per non-exempt tracker with correct wage and affordability", () => {
    const trackers = [
      createWageTracker("Low"),
      createWageTracker("Medium"),
      createWageTracker("High"),
      createWageTracker("None"), // Dusty Broom — excluded
    ];

    const items = buildPaydayLineItems(5, trackers);
    expect(items).toHaveLength(3);
    expect(items[0].wage).toBe(2);
    expect(items[0].canPay).toBe(true);
    expect(items[1].wage).toBe(4);
    expect(items[1].canPay).toBe(true);
    expect(items[2].wage).toBe(6);
    expect(items[2].canPay).toBe(false);
    for (const item of items) {
      expect(item.sellValue).toBe(1);
    }
  });

  test("reflects escalated wages when trackers have survived prior paydays", () => {
    let t = createWageTracker("Low");
    // Fake: pretend this hireling already survived 2 paydays
    t = { ...t, paydaysSurvived: 2 };
    const [item] = buildPaydayLineItems(100, [t]);
    expect(item.wage).toBe(6);
  });

  test("omits Dusty Broom-style trackers entirely", () => {
    const items = buildPaydayLineItems(0, [createWageTracker("None")]);
    expect(items).toHaveLength(0);
  });

  test("empty tracker list returns empty line items", () => {
    expect(buildPaydayLineItems(100, [])).toEqual([]);
  });

  test("canPay reflects updated gold when rebuilt after a payment", () => {
    const trackers = [createWageTracker("Low"), createWageTracker("Low")];
    const before = buildPaydayLineItems(3, trackers);
    expect(before.map((i) => i.canPay)).toEqual([true, true]);

    // Player pays the first hireling: gold drops from 3 to 1; rebuild.
    const after = buildPaydayLineItems(1, trackers.slice(1));
    expect(after.map((i) => i.canPay)).toEqual([false]);
  });

  test("throws if a tracker past MAX_PAYDAYS is fed in (documents behaviour)", () => {
    let t = createWageTracker("Low");
    for (let i = 0; i < MAX_PAYDAYS; i++) t = survivePayday(t);
    // Past round 15 there are no more paydays, so this caller misuse throws.
    expect(() => buildPaydayLineItems(100, [t])).toThrow();
  });
});
