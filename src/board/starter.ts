import { HirelingCard } from "../cards/types";
import { pick, RNG } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { Board, Hand, HirelingInstance } from "./types";
import { createBoard, placeHireling, STARTER_SLOT } from "./board";
import { createHand, createHirelingInstance } from "./hand";

/**
 * Build a Dusty Broom instance. Its wage tier is "None" (payday-exempt)
 * and its instance id defaults to "starter-dusty-broom" unless overridden.
 * The potion type starts null — call `assignHirelingPotion` or use
 * `createStarterBoard` to bind one of the active types.
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

/**
 * Full starter setup: build a Dusty Broom, bind a random active potion
 * type to it (spec: Dusty Broom's single potion is random from the 5
 * active types), place it at the center active slot, and return the
 * assembled state. Prefer this over calling the three helpers
 * individually so the broom is never left with a null potion.
 */
export function createStarterBoard(
  dustyBroomCard: HirelingCard,
  activeTypes: readonly PotionTypeId[],
  rng: RNG,
  id: string = "starter-dusty-broom"
): { board: Board; hand: Hand; broom: HirelingInstance } {
  if (activeTypes.length === 0) {
    throw new Error("createStarterBoard requires at least one active type.");
  }
  const base = createDustyBroomInstance(dustyBroomCard, id);
  const broom: HirelingInstance = { ...base, potionType: pick(activeTypes, rng) };
  const { board, hand } = createStarterState(broom);
  return { board, hand, broom };
}
