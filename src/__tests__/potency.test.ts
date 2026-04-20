import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { Board } from "../board/types";
import { PotionTypeId } from "../potions/types";
import {
  combinedPotencyForType,
  combinedPotencyFromBoard,
  combinedPotencyMap,
} from "../pricing/potency";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

function placeAt(
  board: Board,
  slot: number,
  cardName: string,
  potionType: PotionTypeId
): Board {
  const card = ALL_HIRELINGS.find((h) => h.name === cardName)!;
  const inst = createHirelingInstance(card, `${cardName}-${slot}`, potionType);
  return placeHireling(board, slot, inst);
}

describe("combined potency", () => {
  test("only counts hirelings whose potionType matches", () => {
    let b = createBoard();
    b = placeAt(b, 2, "Doughboy", "love"); // potency 4
    b = placeAt(b, 3, "Doughboy", "luck"); // potency 4 (different type)
    b = placeAt(b, 4, "Doughboy", "love"); // potency 4

    expect(combinedPotencyFromBoard(b, "love")).toBe(8);
    expect(combinedPotencyFromBoard(b, "luck")).toBe(4);
    expect(combinedPotencyFromBoard(b, "flutterfix")).toBe(0);
  });

  test("excludes bench hirelings (slots 0 and 6)", () => {
    let b = createBoard();
    b = placeAt(b, 0, "Doughboy", "love"); // bench — should NOT count
    b = placeAt(b, 3, "Doughboy", "love"); // active — counts
    b = placeAt(b, 6, "Doughboy", "love"); // bench — should NOT count

    expect(combinedPotencyFromBoard(b, "love")).toBe(4);
  });

  test("hirelings with null potionType contribute nothing", () => {
    const card = ALL_HIRELINGS.find((h) => h.name === "Doughboy")!;
    const inst = createHirelingInstance(card, "x", null);
    const b = placeHireling(createBoard(), 3, inst);
    expect(combinedPotencyFromBoard(b, "love")).toBe(0);
  });

  test("combinedPotencyMap returns one entry per active type", () => {
    let b = createBoard();
    b = placeAt(b, 2, "Doughboy", "love");
    b = placeAt(b, 3, "Sugar Sprinkler", "luck"); // potency 5
    const map = combinedPotencyMap(b, ACTIVE);
    expect(map.get("love")).toBe(4);
    expect(map.get("luck")).toBe(5);
    expect(map.get("flutterfix")).toBe(0);
    expect(map.size).toBe(ACTIVE.length);
  });

  test("combinedPotencyForType with an empty list is 0", () => {
    expect(combinedPotencyForType([], "love")).toBe(0);
  });
});
