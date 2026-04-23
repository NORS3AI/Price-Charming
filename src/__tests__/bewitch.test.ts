import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { Board } from "../board/types";
import { Customer } from "../customers/types";
import { mulberry32 } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { defaultPriceMap, setPrice } from "../pricing/panel";
import {
  addCustomer,
  initializeActionState,
  tick,
  BEWITCH_FOCUS_BURST,
  MAX_BEWITCH_LEVEL,
} from "../action/state";
import { ActionLogEntry } from "../action/types";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

function placeAt(
  b: Board,
  slot: number,
  name: string,
  potion: PotionTypeId
): Board {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  return placeHireling(
    b,
    slot,
    createHirelingInstance(card, `${name}-${slot}`, potion)
  );
}

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c-bewitch",
    desiredType: "love",
    budget: 5,
    qualityThreshold: 3,
    reputationStars: 3,
    patienceSeconds: 20,
    axisPriority: ["focus", "type", "budget", "quality"],
    ...overrides,
  };
}

describe("Bewitch primitive", () => {
  test("a Bewitch cast pushes the player's focus axis by BEWITCH_FOCUS_BURST", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Candied Witch", "love"); // 5s cast, Bewitch keyword
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer());
    s = tick(s, 6, mulberry32(1)); // cast fires at 5s
    expect(s.customers[0].axes.focus.playerFill).toBeGreaterThanOrEqual(
      BEWITCH_FOCUS_BURST
    );
    expect(s.customers[0].bewitchedByIds).toContain("Candied Witch-3");
  });

  test("a bewitch log entry records the caster, customer(s), and burst", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Candied Witch", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer());
    s = tick(s, 6, mulberry32(1));
    const bewitch = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "bewitch" }> =>
        e.kind === "bewitch"
    );
    expect(bewitch).toBeDefined();
    expect(bewitch!.casterId).toBe("Candied Witch-3");
    expect(bewitch!.customerIds).toEqual(["c-bewitch"]);
    expect(bewitch!.focusBurst).toBe(BEWITCH_FOCUS_BURST);
  });

  test("a hireling does not re-Bewitch the same customer twice", () => {
    // Candied Witch casts every 5s; across 11s it casts twice but the
    // same customer only gets tagged by this caster once.
    let b = createBoard();
    b = placeAt(b, 3, "Candied Witch", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer());
    s = tick(s, 11, mulberry32(1));
    const tags = s.customers[0].bewitchedByIds.filter(
      (id) => id === "Candied Witch-3"
    );
    expect(tags.length).toBe(1);
  });

  test("bewitchLevel starts at 1 and bumps to 2 after selling to a Bewitched customer", () => {
    // Masked Minstrel: 6s cast, Knockoff x2 + Bewitch + Haggle. It will
    // Bewitch the customer at 6s, then the customer (patience 12s,
    // budget high) resolves for the player and is sold to.
    let b = createBoard();
    b = placeAt(b, 3, "Masked Minstrel", "love");
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 3);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(
      s,
      makeCustomer({
        patienceSeconds: 12,
        reputationStars: 2,
        budget: 20,
        qualityThreshold: 1,
      })
    );
    s = tick(s, 12, mulberry32(1));
    const mm = s.hirelingStates.get("Masked Minstrel-3")!;
    // Sold (unitsSoldThisRound > 0) + had Bewitched the customer →
    // bewitchLevel bumped to 2.
    expect(mm.unitsSoldThisRound).toBeGreaterThan(0);
    expect(mm.bewitchLevel).toBe(2);
  });

  test("bewitchLevel caps at MAX_BEWITCH_LEVEL even after multiple Bewitched sales", () => {
    // Multiple sales via addCustomer loop — bewitchLevel must not
    // exceed MAX_BEWITCH_LEVEL (2).
    let b = createBoard();
    b = placeAt(b, 3, "Masked Minstrel", "love");
    let prices = defaultPriceMap(ACTIVE);
    prices = setPrice(prices, "love", 1, 3);
    let s = initializeActionState(b, prices, ACTIVE, mulberry32(1), 0, 0);
    for (let i = 0; i < 5; i++) {
      s = addCustomer(
        s,
        makeCustomer({
          id: `c${i}`,
          patienceSeconds: 15,
          reputationStars: 2,
          budget: 20,
          qualityThreshold: 1,
        })
      );
      s = tick(s, 8, mulberry32(i + 1));
    }
    const mm = s.hirelingStates.get("Masked Minstrel-3")!;
    expect(mm.bewitchLevel).toBeLessThanOrEqual(MAX_BEWITCH_LEVEL);
  });

  test("a level-2 Bewitch targets up to 2 unresolved customers simultaneously", () => {
    // Pre-bump the caster's bewitchLevel to 2 by setting it on the
    // initial state directly.
    let b = createBoard();
    b = placeAt(b, 3, "Candied Witch", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    // Simulate already-earned level 2.
    const hs = s.hirelingStates.get("Candied Witch-3")!;
    const states = new Map(s.hirelingStates);
    states.set("Candied Witch-3", { ...hs, bewitchLevel: 2 });
    s = { ...s, hirelingStates: states };
    // Add two customers.
    s = addCustomer(s, makeCustomer({ id: "c1" }));
    s = addCustomer(s, makeCustomer({ id: "c2" }));
    s = tick(s, 6, mulberry32(1));
    expect(s.customers[0].bewitchedByIds).toContain("Candied Witch-3");
    expect(s.customers[1].bewitchedByIds).toContain("Candied Witch-3");
    const bewitch = s.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "bewitch" }> =>
        e.kind === "bewitch"
    );
    expect(bewitch!.customerIds.length).toBe(2);
  });

  test("a non-Bewitch hireling never emits a bewitch log entry", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Doughboy", "love"); // no Bewitch
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = addCustomer(s, makeCustomer());
    s = tick(s, 6, mulberry32(1));
    expect(s.log.some((e) => e.kind === "bewitch")).toBe(false);
    expect(s.customers[0].bewitchedByIds).toEqual([]);
  });

  test("Bewitch does nothing when there are no unresolved customers", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Candied Witch", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    // No customers added.
    s = tick(s, 6, mulberry32(1));
    expect(s.log.some((e) => e.kind === "bewitch")).toBe(false);
  });
});
