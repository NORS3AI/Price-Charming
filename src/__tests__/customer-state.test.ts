import {
  AXES,
  AXIS_THRESHOLD,
  Customer,
  CustomerState,
  MAX_REPUTATION_STARS,
  MIN_REPUTATION_STARS,
} from "../customers/types";
import {
  applyContribution,
  axesLedBy,
  axisLeader,
  createCustomerState,
  determineWinner,
  isExpired,
  reputationReward,
  resolveCustomer,
  tickPatience,
} from "../customers/state";

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    desiredType: "love",
    budget: 3,
    qualityThreshold: 5,
    reputationStars: 3,
    patienceSeconds: 10,
    axisPriority: ["focus", "type", "budget", "quality"],
    ...overrides,
  };
}

describe("createCustomerState", () => {
  test("starts every axis at 0/0 and patience at full", () => {
    const s = createCustomerState(makeCustomer());
    for (const axis of AXES) {
      expect(s.axes[axis]).toEqual({ playerFill: 0, opponentFill: 0 });
    }
    expect(s.patienceRemaining).toBe(10);
    expect(s.resolvedFor).toBeNull();
  });

  test("rejects reputationStars outside 1..5", () => {
    expect(() => createCustomerState(makeCustomer({ reputationStars: 0 }))).toThrow();
    expect(() =>
      createCustomerState(makeCustomer({ reputationStars: 6 }))
    ).toThrow();
    expect(() =>
      createCustomerState(makeCustomer({ reputationStars: 2.5 }))
    ).toThrow();
  });

  test("accepts the 1..5 boundary values", () => {
    expect(() =>
      createCustomerState(makeCustomer({ reputationStars: MIN_REPUTATION_STARS }))
    ).not.toThrow();
    expect(() =>
      createCustomerState(makeCustomer({ reputationStars: MAX_REPUTATION_STARS }))
    ).not.toThrow();
  });

  test("rejects malformed axisPriority (wrong length or duplicates)", () => {
    expect(() =>
      createCustomerState(makeCustomer({ axisPriority: ["focus", "type", "budget"] }))
    ).toThrow();
    expect(() =>
      createCustomerState(
        makeCustomer({ axisPriority: ["focus", "focus", "budget", "quality"] })
      )
    ).toThrow();
  });

  test("rejects non-positive patience", () => {
    expect(() =>
      createCustomerState(makeCustomer({ patienceSeconds: 0 }))
    ).toThrow();
    expect(() =>
      createCustomerState(makeCustomer({ patienceSeconds: -1 }))
    ).toThrow();
  });
});

describe("applyContribution", () => {
  test("adds to the correct side and clamps at threshold", () => {
    let s = createCustomerState(makeCustomer());
    s = applyContribution(s, "focus", "player", 40);
    expect(s.axes.focus.playerFill).toBe(40);
    s = applyContribution(s, "focus", "player", 999);
    expect(s.axes.focus.playerFill).toBe(AXIS_THRESHOLD);
  });

  test("clamps negative fills at 0", () => {
    let s = createCustomerState(makeCustomer());
    s = applyContribution(s, "focus", "opponent", 20);
    s = applyContribution(s, "focus", "opponent", -100);
    expect(s.axes.focus.opponentFill).toBe(0);
  });

  test("does not mutate the input state", () => {
    const s0 = createCustomerState(makeCustomer());
    const s1 = applyContribution(s0, "focus", "player", 10);
    expect(s0.axes.focus.playerFill).toBe(0);
    expect(s1.axes.focus.playerFill).toBe(10);
    expect(s0).not.toBe(s1);
  });

  test("noop when the customer is already resolved", () => {
    let s = createCustomerState(makeCustomer());
    s = applyContribution(s, "focus", "player", AXIS_THRESHOLD);
    s = resolveCustomer(s);
    const after = applyContribution(s, "focus", "opponent", 50);
    expect(after).toBe(s);
  });
});

describe("tickPatience", () => {
  test("decrements and floors at 0", () => {
    let s = createCustomerState(makeCustomer());
    s = tickPatience(s, 3);
    expect(s.patienceRemaining).toBe(7);
    s = tickPatience(s, 100);
    expect(s.patienceRemaining).toBe(0);
    expect(isExpired(s)).toBe(true);
  });

  test("noop when already resolved", () => {
    let s = createCustomerState(makeCustomer());
    s = resolveCustomer(s); // resolves with no winner, but sets resolvedFor anyway? check
    // determineWinner returns null with empty bars, so resolvedFor stays null.
    // Force resolution:
    s = applyContribution(s, "focus", "player", AXIS_THRESHOLD);
    s = resolveCustomer(s);
    expect(s.resolvedFor).toBe("player");
    const after = tickPatience(s, 5);
    expect(after).toBe(s);
  });

  test("rejects negative seconds", () => {
    const s = createCustomerState(makeCustomer());
    expect(() => tickPatience(s, -1)).toThrow();
  });
});

describe("axisLeader / axesLedBy", () => {
  test("null when both sides are equal", () => {
    const s = createCustomerState(makeCustomer());
    expect(axisLeader(s, "focus")).toBeNull();
    expect(axesLedBy(s, "player")).toBe(0);
  });

  test("tracks strictly-greater fills", () => {
    let s = createCustomerState(makeCustomer());
    s = applyContribution(s, "focus", "player", 30);
    s = applyContribution(s, "type", "opponent", 40);
    s = applyContribution(s, "budget", "player", 10);
    s = applyContribution(s, "budget", "opponent", 10); // tied axis
    expect(axisLeader(s, "focus")).toBe("player");
    expect(axisLeader(s, "type")).toBe("opponent");
    expect(axisLeader(s, "budget")).toBeNull();
    expect(axesLedBy(s, "player")).toBe(1);
    expect(axesLedBy(s, "opponent")).toBe(1);
  });
});

describe("determineWinner / resolveCustomer", () => {
  test("side with more lead axes wins", () => {
    let s = createCustomerState(makeCustomer());
    s = applyContribution(s, "focus", "player", 30);
    s = applyContribution(s, "type", "player", 30);
    s = applyContribution(s, "budget", "opponent", 30);
    expect(determineWinner(s)).toBe("player");
  });

  test("axis priority breaks a tie", () => {
    const customer = makeCustomer({
      axisPriority: ["quality", "budget", "type", "focus"],
    });
    let s = createCustomerState(customer);
    // 2v2 split. Highest-priority lead (quality) goes to opponent.
    s = applyContribution(s, "focus", "player", 30);
    s = applyContribution(s, "type", "player", 30);
    s = applyContribution(s, "quality", "opponent", 30);
    s = applyContribution(s, "budget", "opponent", 30);
    expect(determineWinner(s)).toBe("opponent");
  });

  test("returns null when no axis has a lead", () => {
    const s = createCustomerState(makeCustomer());
    expect(determineWinner(s)).toBeNull();
  });

  test("resolveCustomer locks in the decision once", () => {
    let s = createCustomerState(makeCustomer());
    s = applyContribution(s, "focus", "player", 30);
    s = resolveCustomer(s);
    expect(s.resolvedFor).toBe("player");
    const stable = resolveCustomer(s);
    expect(stable).toBe(s);
  });
});

describe("reputationReward", () => {
  test("returns the stars on a player win", () => {
    let s = createCustomerState(makeCustomer({ reputationStars: 4 }));
    s = applyContribution(s, "focus", "player", 30);
    s = resolveCustomer(s);
    expect(reputationReward(s)).toBe(4);
  });

  test("returns 0 on opponent win or no-decision", () => {
    let loss = createCustomerState(makeCustomer());
    loss = applyContribution(loss, "focus", "opponent", 30);
    loss = resolveCustomer(loss);
    expect(reputationReward(loss)).toBe(0);

    const undecided = createCustomerState(makeCustomer());
    const resolved = resolveCustomer(undecided);
    expect(resolved.resolvedFor).toBeNull();
    expect(reputationReward(resolved)).toBe(0);
  });
});
