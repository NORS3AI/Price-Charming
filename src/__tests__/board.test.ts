import { ALL_HIRELINGS } from "../cards/hirelings";
import { ALL_SPELLS } from "../cards/spells";
import { createWageTracker } from "../economy/wages";
import { SELL_VALUE } from "../economy/gold";
import {
  ACTIVE_SLOTS,
  BENCH_SLOTS,
  BOARD_SIZE,
  STARTER_SLOT,
  activeHirelings,
  allHirelings,
  benchHirelings,
  createBoard,
  firstEmptySlot,
  isActiveSlot,
  isBenchSlot,
  isBoardFull,
  placeHireling,
  playHirelingFromHand,
  rearrangeBoard,
  sellHirelingFromBoard,
  sellHirelingFromHand,
} from "../board/board";
import { addToHand, createHand } from "../board/hand";
import { HirelingInstance } from "../board/types";

function mkHireling(name: string, id: string): HirelingInstance {
  const card = ALL_HIRELINGS.find((h) => h.name === name);
  if (!card) throw new Error(`Missing hireling: ${name}`);
  return { id, card, wageTracker: createWageTracker(card.wageTier) };
}

describe("board layout constants", () => {
  test("7 slots with correct bench/active split", () => {
    expect(BOARD_SIZE).toBe(7);
    expect([...BENCH_SLOTS]).toEqual([0, 6]);
    expect([...ACTIVE_SLOTS]).toEqual([1, 2, 3, 4, 5]);
    expect(STARTER_SLOT).toBe(3);
  });

  test("BENCH_SLOTS and ACTIVE_SLOTS are frozen at runtime", () => {
    expect(Object.isFrozen(BENCH_SLOTS)).toBe(true);
    expect(Object.isFrozen(ACTIVE_SLOTS)).toBe(true);
  });

  test("isBenchSlot / isActiveSlot classify correctly", () => {
    for (let s = 0; s < BOARD_SIZE; s++) {
      if (s === 0 || s === 6) {
        expect(isBenchSlot(s)).toBe(true);
        expect(isActiveSlot(s)).toBe(false);
      } else {
        expect(isBenchSlot(s)).toBe(false);
        expect(isActiveSlot(s)).toBe(true);
      }
    }
  });

  test("STARTER_SLOT is an active slot", () => {
    expect(isActiveSlot(STARTER_SLOT)).toBe(true);
  });
});

describe("createBoard / placement", () => {
  test("new board has all 7 slots empty", () => {
    const b = createBoard();
    expect(b.slots.length).toBe(BOARD_SIZE);
    expect(b.slots.every((s) => s === null)).toBe(true);
    expect(firstEmptySlot(b)).toBe(0);
    expect(isBoardFull(b)).toBe(false);
  });

  test("placeHireling puts the instance at the requested slot", () => {
    const a = mkHireling("Doughboy", "a");
    const b = placeHireling(createBoard(), 3, a);
    expect(b.slots[3]).toBe(a);
    expect(firstEmptySlot(b)).toBe(0);
  });

  test("placeHireling on an occupied slot throws", () => {
    const a = mkHireling("Doughboy", "a");
    const b = placeHireling(createBoard(), 3, a);
    const other = mkHireling("Doughboy", "b");
    expect(() => placeHireling(b, 3, other)).toThrow(/already occupied/);
  });

  test("placeHireling rejects out-of-range slots", () => {
    const a = mkHireling("Doughboy", "a");
    expect(() => placeHireling(createBoard(), -1, a)).toThrow();
    expect(() => placeHireling(createBoard(), BOARD_SIZE, a)).toThrow();
    expect(() => placeHireling(createBoard(), 2.5, a)).toThrow();
  });

  test("isBoardFull true only when every slot is occupied", () => {
    let b = createBoard();
    for (let i = 0; i < BOARD_SIZE - 1; i++) {
      b = placeHireling(b, i, mkHireling("Doughboy", `x${i}`));
    }
    expect(isBoardFull(b)).toBe(false);
    b = placeHireling(b, BOARD_SIZE - 1, mkHireling("Doughboy", "last"));
    expect(isBoardFull(b)).toBe(true);
    expect(firstEmptySlot(b)).toBeNull();
  });
});

describe("active / bench helpers", () => {
  test("filter to active and bench sections respectively", () => {
    let b = createBoard();
    const a = mkHireling("Doughboy", "a");
    const c = mkHireling("Doughboy", "c");
    const d = mkHireling("Doughboy", "d");
    b = placeHireling(b, 0, a); // bench
    b = placeHireling(b, 3, c); // active center
    b = placeHireling(b, 6, d); // bench

    expect(activeHirelings(b).map((x) => x.id)).toEqual(["c"]);
    expect(benchHirelings(b).map((x) => x.id)).toEqual(["a", "d"]);
    expect(allHirelings(b).map((x) => x.id)).toEqual(["a", "c", "d"]);
  });
});

describe("playHirelingFromHand", () => {
  test("moves a hireling from hand to an empty board slot", () => {
    const inst = mkHireling("Doughboy", "inst");
    let hand = addToHand(createHand(), inst);
    const res = playHirelingFromHand(createBoard(), hand, 0, 3);
    expect(res.board.slots[3]).toBe(inst);
    expect(res.hand.cards).toEqual([]);
  });

  test("throws when the card at hand index is a spell", () => {
    const spell = ALL_SPELLS.find((s) => s.name === "Potion Polish")!;
    const spellInstance = { id: "s1", card: spell };
    let hand = addToHand(createHand(), spellInstance);
    expect(() => playHirelingFromHand(createBoard(), hand, 0, 3)).toThrow(
      /not a hireling/
    );
  });

  test("throws when the target slot is occupied", () => {
    const existing = mkHireling("Doughboy", "existing");
    const board = placeHireling(createBoard(), 3, existing);
    const incoming = mkHireling("Doughboy", "incoming");
    const hand = addToHand(createHand(), incoming);
    expect(() => playHirelingFromHand(board, hand, 0, 3)).toThrow(
      /already occupied/
    );
  });

  test("throws when the hand index is invalid", () => {
    expect(() =>
      playHirelingFromHand(createBoard(), createHand(), 0, 3)
    ).toThrow(/No card/);
  });
});

describe("sell operations", () => {
  test("sellHirelingFromBoard frees the slot and returns sell value", () => {
    const inst = mkHireling("Doughboy", "inst");
    const board = placeHireling(createBoard(), 3, inst);
    const res = sellHirelingFromBoard(board, 3);
    expect(res.sold).toBe(inst);
    expect(res.sellValue).toBe(SELL_VALUE);
    expect(res.board.slots[3]).toBeNull();
  });

  test("sellHirelingFromBoard throws on empty slot", () => {
    expect(() => sellHirelingFromBoard(createBoard(), 3)).toThrow(
      /nothing to sell/
    );
  });

  test("sellHirelingFromHand removes and returns the hireling", () => {
    const inst = mkHireling("Doughboy", "inst");
    const hand = addToHand(createHand(), inst);
    const res = sellHirelingFromHand(hand, 0);
    expect(res.sold).toBe(inst);
    expect(res.sellValue).toBe(SELL_VALUE);
    expect(res.hand.cards).toEqual([]);
  });

  test("sellHirelingFromHand refuses to sell a spell", () => {
    const spell = ALL_SPELLS.find((s) => s.name === "Potion Polish")!;
    const spellInstance = { id: "s1", card: spell };
    const hand = addToHand(createHand(), spellInstance);
    expect(() => sellHirelingFromHand(hand, 0)).toThrow(
      /Spells cannot be sold/
    );
  });
});

describe("rearrangeBoard", () => {
  function boardOf(ids: (string | null)[]) {
    let b = createBoard();
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (id) b = placeHireling(b, i, mkHireling("Doughboy", id));
    }
    return b;
  }
  function idsOf(b: ReturnType<typeof boardOf>) {
    return b.slots.map((s) => (s ? s.id : null));
  }

  test("moves a hireling and shifts intermediate slots (splice-insert, high→low)", () => {
    const b = boardOf(["A", "B", "C", "D", "E", "F", "G"]);
    const next = rearrangeBoard(b, 4, 1); // move E to slot 1
    expect(idsOf(next)).toEqual(["A", "E", "B", "C", "D", "F", "G"]);
  });

  test("splice-insert also shifts when fromSlot < toSlot (low→high)", () => {
    const b = boardOf(["A", "B", "C", "D", null, null, null]);
    // Drag A rightward to slot 2; B and C shift left to close the gap.
    const next = rearrangeBoard(b, 0, 2);
    expect(idsOf(next)).toEqual(["B", "C", "A", "D", null, null, null]);
  });

  test("moving from bench to active works", () => {
    const b = boardOf(["A", null, null, null, null, null, null]);
    const next = rearrangeBoard(b, 0, 3);
    expect(idsOf(next)).toEqual([null, null, null, "A", null, null, null]);
  });

  test("no-op when fromSlot === toSlot", () => {
    const b = boardOf(["A", null, null, null, null, null, null]);
    expect(rearrangeBoard(b, 0, 0)).toBe(b);
  });

  test("throws when fromSlot is empty", () => {
    const b = createBoard();
    expect(() => rearrangeBoard(b, 0, 3)).toThrow(/slot 0 is empty/);
  });

  test("throws on out-of-range indices", () => {
    const b = boardOf(["A", null, null, null, null, null, null]);
    expect(() => rearrangeBoard(b, -1, 3)).toThrow();
    expect(() => rearrangeBoard(b, 0, BOARD_SIZE)).toThrow();
  });
});
