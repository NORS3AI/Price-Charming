import { HirelingCard } from "../cards/types";
import { Board, Hand, HirelingInstance } from "./types";
import { createBoard, placeHireling, STARTER_SLOT } from "./board";
import { createHand, createHirelingInstance } from "./hand";

/**
 * Build a Dusty Broom instance. Its wage tier is "None" (payday-exempt)
 * and its instance id defaults to "starter-dusty-broom" unless overridden.
 */
export function createDustyBroomInstance(
  card: HirelingCard,
  id: string = "starter-dusty-broom"
): HirelingInstance {
  if (card.id !== "dusty-broom") {
    throw new Error(
      `createDustyBroomInstance expected the Dusty Broom card (got "${card.id}").`
    );
  }
  return createHirelingInstance(card, id);
}

/**
 * Fresh starter state: empty hand and a board with the given Dusty Broom
 * instance pre-placed in the center active slot (1-indexed slot 4).
 */
export function createStarterState(
  dustyBroom: HirelingInstance
): { board: Board; hand: Hand } {
  const board = placeHireling(createBoard(), STARTER_SLOT, dustyBroom);
  return { board, hand: createHand() };
}
