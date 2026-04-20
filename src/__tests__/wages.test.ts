import {
  MAX_PAYDAYS,
  WAGE_SCHEDULE,
  createWageTracker,
  currentWageDemand,
  isExemptFromPayday,
  survivePayday,
  wageFor,
} from "../economy/wages";

describe("wage schedule", () => {
  test("matches the spec table exactly", () => {
    expect(WAGE_SCHEDULE.Low).toEqual([2, 4, 6, 8, 10]);
    expect(WAGE_SCHEDULE.Medium).toEqual([4, 6, 8, 10, 12]);
    expect(WAGE_SCHEDULE.High).toEqual([6, 8, 10, 12, 14]);
    expect(WAGE_SCHEDULE.None).toEqual([0, 0, 0, 0, 0]);
  });

  test("wageFor returns the right cell for each tier and payday", () => {
    expect(wageFor("Low", 1)).toBe(2);
    expect(wageFor("Low", 4)).toBe(8);
    expect(wageFor("Medium", 3)).toBe(8);
    expect(wageFor("High", 4)).toBe(12);
    expect(wageFor("None", 2)).toBe(0);
  });

  test("wageFor rejects out-of-range payday numbers", () => {
    expect(() => wageFor("Low", 0)).toThrow();
    expect(() => wageFor("Low", MAX_PAYDAYS + 1)).toThrow();
    expect(() => wageFor("Low", 1.5)).toThrow();
  });
});

describe("wage tracker", () => {
  test("new tracker has 0 paydays survived and asks for the payday-1 wage", () => {
    const tracker = createWageTracker("Medium");
    expect(tracker.paydaysSurvived).toBe(0);
    expect(currentWageDemand(tracker)).toBe(4);
  });

  test("surviving a payday increments the counter and the next wage", () => {
    let t = createWageTracker("Low");
    expect(currentWageDemand(t)).toBe(2);
    t = survivePayday(t);
    expect(t.paydaysSurvived).toBe(1);
    expect(currentWageDemand(t)).toBe(4);
    t = survivePayday(t);
    expect(currentWageDemand(t)).toBe(6);
  });

  test("survivePayday does not mutate the input", () => {
    const original = createWageTracker("High");
    const next = survivePayday(original);
    expect(original.paydaysSurvived).toBe(0);
    expect(next.paydaysSurvived).toBe(1);
    expect(original).not.toBe(next);
  });

  test("surviving the full payday schedule caps; beyond that throws", () => {
    let t = createWageTracker("High");
    for (let i = 0; i < MAX_PAYDAYS; i++) t = survivePayday(t);
    expect(t.paydaysSurvived).toBe(MAX_PAYDAYS);
    expect(() => survivePayday(t)).toThrow();
  });

  test("tier None is exempt from payday", () => {
    const broom = createWageTracker("None");
    expect(isExemptFromPayday(broom)).toBe(true);
  });

  test("normal tiers are not exempt", () => {
    expect(isExemptFromPayday(createWageTracker("Low"))).toBe(false);
    expect(isExemptFromPayday(createWageTracker("Medium"))).toBe(false);
    expect(isExemptFromPayday(createWageTracker("High"))).toBe(false);
  });
});
