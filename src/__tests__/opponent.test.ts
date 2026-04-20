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
  finalizeRound,
  initializeActionState,
  setOpponent,
  tick,
} from "../action/state";
import { ActionLogEntry } from "../action/types";
import { captureSnapshot } from "../opponent/snapshot";
import { settleRound } from "../opponent/settlement";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

function placeAt(b: Board, slot: number, name: string, potion: PotionTypeId): Board {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  return placeHireling(
    b,
    slot,
    createHirelingInstance(card, `${name}-${slot}`, potion)
  );
}

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    desiredType: "love",
    budget: 5,
    qualityThreshold: 3,
    reputationStars: 3,
    patienceSeconds: 10,
    axisPriority: ["focus", "type", "budget", "quality"],
    ...overrides,
  };
}

describe("captureSnapshot", () => {
  test("returns a typed snapshot with all provided fields", () => {
    let b = createBoard();
    b = placeAt(b, 3, "Pantry Stocker", "love");
    const prices = setPrice(defaultPriceMap(ACTIVE), "love", 1, 8);
    const snap = captureSnapshot({
      id: "champ-1",
      round: 5,
      board: b,
      prices,
      activePotionTypes: ACTIVE,
      reputation: 12,
    });
    expect(snap.id).toBe("champ-1");
    expect(snap.round).toBe(5);
    expect(snap.reputation).toBe(12);
    expect(snap.board).toBe(b);
  });

  test("rejects non-positive round", () => {
    expect(() =>
      captureSnapshot({
        id: "x",
        round: 0,
        board: createBoard(),
        prices: defaultPriceMap(ACTIVE),
        activePotionTypes: ACTIVE,
        reputation: 0,
      })
    ).toThrow();
  });

  test("rejects empty id", () => {
    expect(() =>
      captureSnapshot({
        id: "",
        round: 1,
        board: createBoard(),
        prices: defaultPriceMap(ACTIVE),
        activePotionTypes: ACTIVE,
        reputation: 0,
      })
    ).toThrow(/non-empty/);
  });
});

describe("opponent contributions", () => {
  test("a strong opponent steals the customer from an empty player", () => {
    // Player has nothing on board; opponent has a Pantry Stocker selling Love.
    let oppBoard = createBoard();
    oppBoard = placeAt(oppBoard, 3, "Pantry Stocker", "love");
    const oppPrices = setPrice(defaultPriceMap(ACTIVE), "love", 1, 8);
    const snapshot = captureSnapshot({
      id: "opp-1",
      round: 3,
      board: oppBoard,
      prices: oppPrices,
      activePotionTypes: ACTIVE,
      reputation: 0,
    });

    let s = initializeActionState(
      createBoard(),
      defaultPriceMap(ACTIVE),
      ACTIVE,
      mulberry32(1),
      0,
      0
    );
    s = setOpponent(s, snapshot);
    s = addCustomer(s, makeCustomer({ patienceSeconds: 5 }));
    s = tick(s, 5, mulberry32(1));

    expect(s.customers[0].resolvedFor).toBe("opponent");
    expect(s.gold).toBe(0);
    expect(s.reputation).toBe(0);
  });

  test("player and opponent with identical boards split axes; priority breaks the tie", () => {
    // Both sides: Pantry Stocker selling Love. All axes should tie.
    const card = "Pantry Stocker";
    let playerBoard = createBoard();
    playerBoard = placeAt(playerBoard, 3, card, "love");
    let oppBoard = createBoard();
    oppBoard = placeAt(oppBoard, 3, card, "love");

    const prices = setPrice(defaultPriceMap(ACTIVE), "love", 1, 8);
    const snapshot = captureSnapshot({
      id: "opp-tie",
      round: 3,
      board: oppBoard,
      prices,
      activePotionTypes: ACTIVE,
      reputation: 0,
    });

    let s = initializeActionState(
      playerBoard,
      prices,
      ACTIVE,
      mulberry32(1),
      0,
      0
    );
    s = setOpponent(s, snapshot);
    s = addCustomer(s, makeCustomer({ patienceSeconds: 5 }));
    s = tick(s, 5, mulberry32(1));

    // All four axes tied → determineWinner returns null → "no-sale".
    expect(s.customers[0].resolvedFor).toBe("no-sale");
  });

  test("setOpponent replaces any previously installed snapshot", () => {
    let s = initializeActionState(
      createBoard(),
      defaultPriceMap(ACTIVE),
      ACTIVE,
      mulberry32(1)
    );
    const snap1 = captureSnapshot({
      id: "a",
      round: 1,
      board: createBoard(),
      prices: defaultPriceMap(ACTIVE),
      activePotionTypes: ACTIVE,
      reputation: 0,
    });
    const snap2 = captureSnapshot({
      id: "b",
      round: 1,
      board: createBoard(),
      prices: defaultPriceMap(ACTIVE),
      activePotionTypes: ACTIVE,
      reputation: 5,
    });
    s = setOpponent(s, snap1);
    expect(s.opponent?.id).toBe("a");
    s = setOpponent(s, snap2);
    expect(s.opponent?.id).toBe("b");
  });
});

describe("finalizeRound + settleRound", () => {
  test("forces stragglers to no-sale and counts outcomes", () => {
    let playerBoard = createBoard();
    playerBoard = placeAt(playerBoard, 3, "Pantry Stocker", "love");
    const prices = setPrice(defaultPriceMap(ACTIVE), "love", 1, 8);

    let s = initializeActionState(playerBoard, prices, ACTIVE, mulberry32(1), 0, 0);
    // Three customers with varying patience so one resolves for player,
    // one resolves for opponent (we'll override by installing a snapshot),
    // and one still unresolved at tick end.
    s = addCustomer(s, makeCustomer({ id: "c-win", patienceSeconds: 2 }));
    s = addCustomer(s, makeCustomer({ id: "c-pending", patienceSeconds: 100 }));
    s = tick(s, 3, mulberry32(1));
    expect(s.customers[0].resolvedFor).toBe("player");
    expect(s.customers[1].resolvedFor).toBeNull();

    const final = finalizeRound(s);
    // Still-unresolved customer gets resolved with its current fills.
    expect(final.customers[1].resolvedFor).not.toBeNull();

    const result = settleRound(final);
    expect(result.customersWon).toBeGreaterThanOrEqual(1);
    expect(result.customersUnresolved).toBe(0);
    expect(typeof result.playerWonRound).toBe("boolean");
  });

  test("finalizeRound executes the sale for a player-leading straggler (regression)", () => {
    // Player with Pantry Stocker selling Love; customer with a long
    // patience so they haven't expired yet when we finalize.
    let playerBoard = createBoard();
    playerBoard = placeAt(playerBoard, 3, "Pantry Stocker", "love");
    const prices = setPrice(defaultPriceMap(ACTIVE), "love", 1, 8);
    let s = initializeActionState(playerBoard, prices, ACTIVE, mulberry32(1), 0, 0);
    s = addCustomer(
      s,
      makeCustomer({ id: "straggler", patienceSeconds: 100, reputationStars: 2 })
    );
    s = tick(s, 5, mulberry32(1));
    // Customer is leading for player on every axis, but patience is
    // nowhere near expiring.
    expect(s.customers[0].resolvedFor).toBeNull();
    expect(s.gold).toBe(0);

    const finalState = finalizeRound(s);
    expect(finalState.customers[0].resolvedFor).toBe("player");

    // The sale must fire: gold and reputation should both tick up.
    expect(finalState.gold).toBeGreaterThan(0);
    expect(finalState.reputation).toBe(2);

    // And a customer-resolved log entry should have been emitted.
    const resolvedLog = finalState.log.find(
      (e): e is Extract<ActionLogEntry, { kind: "customer-resolved" }> =>
        e.kind === "customer-resolved" && e.customerId === "straggler"
    );
    expect(resolvedLog?.resolution).toBe("player");
  });

  test("finalizeRound is a no-op when every customer already resolved", () => {
    const s = initializeActionState(
      createBoard(),
      defaultPriceMap(ACTIVE),
      ACTIVE,
      mulberry32(1)
    );
    expect(finalizeRound(s)).toBe(s);
  });

  test("finalizeRound is idempotent across repeated calls (end-of-round hooks do not double-fire)", () => {
    // A Burnt Batch in an active slot would double-apply its +6 potency
    // buff if finalizeRound embedded the end-of-round hook — this test
    // guards that the hook lives outside finalizeRound.
    let b = createBoard();
    const card = ALL_HIRELINGS.find((h) => h.name === "Burnt Batch")!;
    b = placeHireling(b, 3, createHirelingInstance(card, "Burnt Batch-3", "love"));
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = tick(s, 10, mulberry32(1));
    const once = finalizeRound(s);
    const twice = finalizeRound(once);
    const bbOnce = once.hirelingStates.get("Burnt Batch-3")!;
    const bbTwice = twice.hirelingStates.get("Burnt Batch-3")!;
    expect(bbOnce.permanentPotencyGainedThisRound).toBe(
      bbTwice.permanentPotencyGainedThisRound
    );
  });

  test("settleRound.playerWonRound true only when player customer count exceeds opponent", () => {
    // Empty player vs strong opponent — player loses the customer.
    let oppBoard = createBoard();
    oppBoard = placeAt(oppBoard, 3, "Pantry Stocker", "love");
    const snapshot = captureSnapshot({
      id: "opp",
      round: 1,
      board: oppBoard,
      prices: setPrice(defaultPriceMap(ACTIVE), "love", 1, 8),
      activePotionTypes: ACTIVE,
      reputation: 0,
    });

    let s = initializeActionState(
      createBoard(),
      defaultPriceMap(ACTIVE),
      ACTIVE,
      mulberry32(1),
      0,
      0
    );
    s = setOpponent(s, snapshot);
    s = addCustomer(s, makeCustomer({ patienceSeconds: 3 }));
    s = tick(s, 3, mulberry32(1));
    const result = settleRound(finalizeRound(s));
    expect(result.customersLost).toBe(1);
    expect(result.customersWon).toBe(0);
    expect(result.playerWonRound).toBe(false);
  });
});
