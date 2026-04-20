import { ALL_HIRELINGS } from "../cards/hirelings";
import { STARTER_SLOT } from "../board/board";
import { createHand, handSize } from "../board/hand";
import {
  createDustyBroomInstance,
  createStarterState,
} from "../board/starter";

const dustyBroom = ALL_HIRELINGS.find((h) => h.name === "Dusty Broom")!;

describe("starter state", () => {
  test("createDustyBroomInstance wraps the card with a None-tier tracker", () => {
    const inst = createDustyBroomInstance(dustyBroom);
    expect(inst.card).toBe(dustyBroom);
    expect(inst.wageTracker.tier).toBe("None");
    expect(inst.wageTracker.paydaysSurvived).toBe(0);
    expect(inst.id).toBe("starter-dusty-broom");
  });

  test("createDustyBroomInstance rejects any other card", () => {
    const notBroom = ALL_HIRELINGS.find((h) => h.name === "Doughboy")!;
    expect(() => createDustyBroomInstance(notBroom)).toThrow();
  });

  test("createStarterState places Dusty Broom at the center active slot with an empty hand", () => {
    const inst = createDustyBroomInstance(dustyBroom);
    const { board, hand } = createStarterState(inst);
    expect(board.slots[STARTER_SLOT]).toBe(inst);
    for (let i = 0; i < board.slots.length; i++) {
      if (i !== STARTER_SLOT) expect(board.slots[i]).toBeNull();
    }
    expect(handSize(hand)).toBe(0);
    expect(hand.cards).toEqual(createHand().cards);
  });
});
