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
  isResolved,
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

  test("rejects NaN / Infinity patience", () => {
    expect(() =>
      createCustomerState(makeCustomer({ patienceSeconds: NaN }))
    ).toThrow();
    expect(() =>
      createCustomerState(makeCustomer({ patienceSeconds: Infinity }))
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

  test("rejects NaN / Infinity amounts", () => {
    const s = createCustomerState(makeCustomer());
    expect(() => applyContribution(s, "focus", "player", NaN)).toThrow();
    expect(() =>
      applyContribution(s, "focus", "player", Infinity)
    ).toThrow();
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
    s = applyContribution(s, "focus", "player", AXIS_THRESHOLD);
    s = resolveCustomer(s);
    expect(s.resolvedFor).toBe("player");
    const after = tickPatience(s, 5);
    expect(after).toBe(s);
  });

  test("rejects negative / NaN / Infinity seconds", () => {
    const s = createCustomerState(makeCustomer());
    expect(() => tickPatience(s, -1)).toThrow();
    expect(() => tickPatience(s, NaN)).toThrow();
    expect(() => tickPatience(s, Infinity)).toThrow();
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
  test("side with higher weighted lead score wins", () => {
    // Default priority: focus, type, budget, quality. Weights [4,3,2,1].
    let s = createCustomerState(makeCustomer());
    s = applyContribution(s, "focus", "player", 30);    // player +4
    s = applyContribution(s, "type", "player", 30);      // player +3
    s = applyContribution(s, "budget", "opponent", 30);  // opponent +2
    // Player 7, opponent 2 → player wins.
    expect(determineWinner(s)).toBe("player");
  });

  test("leading the single TOP-priority axis beats leading only the bottom axis", () => {
    // Customer priority: focus > type > budget > quality.
    // Player: focus only (weight 4). Opponent: quality only (weight 1).
    let s = createCustomerState(makeCustomer());
    s = applyContribution(s, "focus", "player", 30);
    s = applyContribution(s, "quality", "opponent", 30);
    expect(determineWinner(s)).toBe("player");
  });

  test("leading the TOP axis beats leading the TWO lowest axes", () => {
    // Player: focus (weight 4). Opponent: budget (2) + quality (1) = 3.
    let s = createCustomerState(makeCustomer());
    s = applyContribution(s, "focus", "player", 30);
    s = applyContribution(s, "budget", "opponent", 30);
    s = applyContribution(s, "quality", "opponent", 30);
    expect(determineWinner(s)).toBe("player");
  });

  test("leading the top axis does NOT beat leading the THREE lowest axes (3+2+1=6 > 4)", () => {
    // Player: focus (4). Opponent: type (3) + budget (2) + quality (1) = 6.
    let s = createCustomerState(makeCustomer());
    s = applyContribution(s, "focus", "player", 30);
    s = applyContribution(s, "type", "opponent", 30);
    s = applyContribution(s, "budget", "opponent", 30);
    s = applyContribution(s, "quality", "opponent", 30);
    expect(determineWinner(s)).toBe("opponent");
  });

  test("randomized priority actually changes the winner", () => {
    // Same axis leads, different priority order — verifies the
    // weighting respects the customer's personal priority list.
    const c1 = makeCustomer({
      axisPriority: ["focus", "type", "budget", "quality"], // focus top
    });
    const c2 = makeCustomer({
      axisPriority: ["quality", "budget", "type", "focus"], // focus last
    });
    let s1 = createCustomerState(c1);
    let s2 = createCustomerState(c2);
    // Both customers: player leads focus, opponent leads quality.
    for (const s of [[c1, s1], [c2, s2]] as const) {
      // no-op loop for readability
    }
    s1 = applyContribution(s1, "focus", "player", 30);
    s1 = applyContribution(s1, "quality", "opponent", 30);
    s2 = applyContribution(s2, "focus", "player", 30);
    s2 = applyContribution(s2, "quality", "opponent", 30);
    // c1: player +4, opponent +1 → player wins.
    expect(determineWinner(s1)).toBe("player");
    // c2: player +1 (focus last), opponent +4 (quality first) → opponent wins.
    expect(determineWinner(s2)).toBe("opponent");
  });

  test("axis priority still breaks a tied weighted score", () => {
    const customer = makeCustomer({
      axisPriority: ["quality", "budget", "type", "focus"],
    });
    let s = createCustomerState(customer);
    // Player: type(2) + focus(1) = 3. Opponent: quality(4)... nope
    // that's already a win. Set up a true tie:
    // Player: quality(4). Opponent: budget(3) + focus(1) = 4. Tie at 4.
    s = applyContribution(s, "quality", "player", 30);
    s = applyContribution(s, "budget", "opponent", 30);
    s = applyContribution(s, "focus", "opponent", 30);
    // Tied 4-4 on weighted score. Tiebreaker: first-listed axis with a
    // leader. Priority order is quality, budget, type, focus. Quality
    // leader is player → player wins the tie.
    expect(determineWinner(s)).toBe("player");
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
    expect(isResolved(s)).toBe(true);
    const stable = resolveCustomer(s);
    expect(stable).toBe(s);
  });

  test("resolves with \"no-sale\" when no axis has a leader", () => {
    const s = createCustomerState(makeCustomer());
    const resolved = resolveCustomer(s);
    expect(resolved.resolvedFor).toBe("no-sale");
    expect(isResolved(resolved)).toBe(true);
  });

  test("no-sale resolution locks out further contributions (regression)", () => {
    let s = createCustomerState(makeCustomer());
    s = resolveCustomer(s);
    expect(s.resolvedFor).toBe("no-sale");
    const after = applyContribution(s, "focus", "player", 50);
    expect(after).toBe(s);
    expect(tickPatience(s, 5)).toBe(s);
  });
});

describe("reputationReward", () => {
  test("returns the stars on a player win", () => {
    let s = createCustomerState(makeCustomer({ reputationStars: 4 }));
    s = applyContribution(s, "focus", "player", 30);
    s = resolveCustomer(s);
    expect(reputationReward(s)).toBe(4);
  });

  test("returns 0 on opponent win or no-sale", () => {
    let loss = createCustomerState(makeCustomer());
    loss = applyContribution(loss, "focus", "opponent", 30);
    loss = resolveCustomer(loss);
    expect(reputationReward(loss)).toBe(0);

    const undecided = createCustomerState(makeCustomer());
    const resolved = resolveCustomer(undecided);
    expect(resolved.resolvedFor).toBe("no-sale");
    expect(reputationReward(resolved)).toBe(0);
  });
});
