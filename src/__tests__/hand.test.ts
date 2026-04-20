import { ALL_HIRELINGS } from "../cards/hirelings";
import { ALL_SPELLS } from "../cards/spells";
import { createWageTracker } from "../economy/wages";
import {
  MAX_HAND_SIZE,
  addToHand,
  createHand,
  handSize,
  isHandFull,
  isHireling,
  isSpell,
  removeFromHand,
} from "../board/hand";
import { HandCardInstance } from "../board/types";

function hireling(name: string, id: string): HandCardInstance {
  const card = ALL_HIRELINGS.find((h) => h.name === name);
  if (!card) throw new Error(`Missing hireling: ${name}`);
  return { id, card, wageTracker: createWageTracker(card.wageTier) };
}

function spell(name: string, id: string): HandCardInstance {
  const card = ALL_SPELLS.find((s) => s.name === name);
  if (!card) throw new Error(`Missing spell: ${name}`);
  return { id, card };
}

describe("hand", () => {
  test("new hand is empty", () => {
    const h = createHand();
    expect(handSize(h)).toBe(0);
    expect(isHandFull(h)).toBe(false);
  });

  test("adds cards and tracks size", () => {
    let h = createHand();
    h = addToHand(h, hireling("Doughboy", "h1"));
    h = addToHand(h, spell("Potion Polish", "s1"));
    expect(handSize(h)).toBe(2);
    expect(h.cards.map((c) => c.id)).toEqual(["h1", "s1"]);
  });

  test("isHandFull is true at exactly MAX_HAND_SIZE and adding throws", () => {
    let h = createHand();
    for (let i = 0; i < MAX_HAND_SIZE; i++) {
      h = addToHand(h, hireling("Doughboy", `h${i}`));
    }
    expect(isHandFull(h)).toBe(true);
    expect(() => addToHand(h, hireling("Doughboy", "overflow"))).toThrow(
      /Hand is full/
    );
  });

  test("removeFromHand returns the card and a new hand without it", () => {
    const a = hireling("Doughboy", "h1");
    const b = spell("Potion Polish", "s1");
    let h = addToHand(addToHand(createHand(), a), b);
    const res = removeFromHand(h, 0);
    expect(res.removed).toBe(a);
    expect(res.hand.cards.map((c) => c.id)).toEqual(["s1"]);
    // Original hand unchanged.
    expect(h.cards.length).toBe(2);
  });

  test("removeFromHand throws on out-of-bounds index", () => {
    const h = createHand();
    expect(() => removeFromHand(h, 0)).toThrow(/No card/);
    const h1 = addToHand(h, hireling("Doughboy", "h1"));
    expect(() => removeFromHand(h1, 5)).toThrow(/No card/);
  });

  test("isHireling / isSpell narrow correctly", () => {
    const h = hireling("Doughboy", "h1");
    const s = spell("Potion Polish", "s1");
    expect(isHireling(h)).toBe(true);
    expect(isSpell(h)).toBe(false);
    expect(isHireling(s)).toBe(false);
    expect(isSpell(s)).toBe(true);
  });
});
