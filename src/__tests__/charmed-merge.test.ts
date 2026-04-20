import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import { addToHand, createHand, createHirelingInstance } from "../board/hand";
import { Board, Hand, HirelingInstance } from "../board/types";
import { PotionTypeId } from "../potions/types";
import { createInitialPool } from "../shop/pool";
import {
  CHARM_MERGE_COUNT,
  buildCharmedInstance,
  findCharmableTriple,
  mergeCharmableTriple,
  mergeIfCharmable,
} from "../charmed/merge";

function inst(name: string, id: string, potion: PotionTypeId): HirelingInstance {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  return createHirelingInstance(card, id, potion);
}

function buffedInst(
  name: string,
  id: string,
  potion: PotionTypeId,
  bonusStock: number,
  bonusPotency: number
): HirelingInstance {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  return createHirelingInstance(card, id, potion, {
    permanentStockBonus: bonusStock,
    permanentPotencyBonus: bonusPotency,
  });
}

describe("CHARM_MERGE_COUNT", () => {
  test("is 3 per spec", () => {
    expect(CHARM_MERGE_COUNT).toBe(3);
  });
});

describe("findCharmableTriple", () => {
  test("returns null when no triple exists", () => {
    const b = placeHireling(createBoard(), 3, inst("Doughboy", "d1", "love"));
    expect(findCharmableTriple(b, createHand())).toBeNull();
  });

  test("ignores hirelings with mismatched potion types", () => {
    let b = createBoard();
    b = placeHireling(b, 2, inst("Doughboy", "d1", "love"));
    b = placeHireling(b, 3, inst("Doughboy", "d2", "luck")); // wrong type
    b = placeHireling(b, 4, inst("Doughboy", "d3", "love"));
    expect(findCharmableTriple(b, createHand())).toBeNull();
  });

  test("ignores hirelings with null potion type", () => {
    let b = createBoard();
    b = placeHireling(b, 2, createHirelingInstance(
      ALL_HIRELINGS.find((h) => h.name === "Doughboy")!,
      "d1",
      null
    ));
    b = placeHireling(b, 3, inst("Doughboy", "d2", "love"));
    b = placeHireling(b, 4, inst("Doughboy", "d3", "love"));
    expect(findCharmableTriple(b, createHand())).toBeNull();
  });

  test("matches across hand and board (any combination)", () => {
    let b = placeHireling(createBoard(), 3, inst("Doughboy", "b1", "love"));
    let h = addToHand(createHand(), inst("Doughboy", "h1", "love"));
    h = addToHand(h, inst("Doughboy", "h2", "love"));
    const triple = findCharmableTriple(b, h);
    expect(triple).not.toBeNull();
    expect(triple!.cardId).toBe("doughboy");
    expect(triple!.potionType).toBe("love");
    expect(triple!.members).toHaveLength(3);
    const sources = triple!.members.map((m) => m.source.kind).sort();
    expect(sources).toEqual(["board", "hand", "hand"]);
  });

  test("ignores existing Charmed instances (no re-merge)", () => {
    const card = ALL_HIRELINGS.find((h) => h.name === "Doughboy")!;
    const charmedA = createHirelingInstance(card, "ca", "love", { charmed: true });
    const charmedB = createHirelingInstance(card, "cb", "love", { charmed: true });
    const charmedC = createHirelingInstance(card, "cc", "love", { charmed: true });
    let h = addToHand(createHand(), charmedA);
    h = addToHand(h, charmedB);
    h = addToHand(h, charmedC);
    expect(findCharmableTriple(createBoard(), h)).toBeNull();
  });
});

describe("buildCharmedInstance", () => {
  test("sums effective stats from all 3 copies", () => {
    // Doughboy has potions[0] = { stock: 0, potency: 4 } in CSV.
    // Three copies with bonuses: total stock = 0+0+0 + 1+2+3 = 6;
    // total potency = 4+4+4 + 0+5+0 = 17.
    const a = buffedInst("Doughboy", "a", "love", 1, 0);
    const b = buffedInst("Doughboy", "b", "love", 2, 5);
    const c = buffedInst("Doughboy", "c", "love", 3, 0);
    const charmed = buildCharmedInstance(
      [
        { instance: a, source: { kind: "hand", index: 0 } },
        { instance: b, source: { kind: "hand", index: 1 } },
        { instance: c, source: { kind: "hand", index: 2 } },
      ],
      "charmed-1"
    );
    const baseStock = a.card.potions[0].stock;
    const basePotency = a.card.potions[0].potency;
    expect(charmed.charmed).toBe(true);
    expect(charmed.id).toBe("charmed-1");
    expect(charmed.card).toBe(a.card);
    expect(charmed.potionType).toBe("love");
    // Effective stock = base + bonus
    expect(baseStock + charmed.permanentStockBonus).toBe(6);
    expect(basePotency + charmed.permanentPotencyBonus).toBe(17);
    expect(charmed.wageTracker.paydaysSurvived).toBe(0); // fresh tracker
  });
});

describe("mergeCharmableTriple", () => {
  test("removes the 3 sources from board/hand and lands the Charmed in hand", () => {
    let b = placeHireling(createBoard(), 3, inst("Doughboy", "b1", "love"));
    let h = addToHand(createHand(), inst("Doughboy", "h1", "love"));
    h = addToHand(h, inst("Doughboy", "h2", "love"));
    const pool = createInitialPool();

    const triple = findCharmableTriple(b, h)!;
    const result = mergeCharmableTriple(triple, { board: b, hand: h, pool }, "ch-1");

    expect(result.board.slots[3]).toBeNull();
    // Hand now has just the new Charmed (the two old ones were removed).
    expect(result.hand.cards).toHaveLength(1);
    expect(result.hand.cards[0]).toBe(result.charmed);
    expect(result.charmed.charmed).toBe(true);
  });

  test("removes the consumed pool instances permanently", () => {
    // Use pool-instance ids so `removeFromPoolWhere` actually targets
    // them. (In real flow, hand instances bought from the shop carry
    // their pool instance id forward.)
    let b = placeHireling(createBoard(), 3, inst("Doughboy", "doughboy#0", "love"));
    let h = addToHand(createHand(), inst("Doughboy", "doughboy#1", "love"));
    h = addToHand(h, inst("Doughboy", "doughboy#2", "love"));
    const pool = createInitialPool();

    const triple = findCharmableTriple(b, h)!;
    const result = mergeCharmableTriple(triple, { board: b, hand: h, pool }, "ch-1");

    // The three doughboy ids that participated are gone from the pool.
    const poolIds = new Set(result.pool.instances.map((i) => i.id));
    expect(poolIds.has("doughboy#0")).toBe(false);
    expect(poolIds.has("doughboy#1")).toBe(false);
    expect(poolIds.has("doughboy#2")).toBe(false);
    // Other pool instances are untouched.
    expect(poolIds.size).toBeGreaterThan(0);
  });
});

describe("hand-overflow safety (regression)", () => {
  test("throws cleanly without mutating the board when the hand would overflow", () => {
    // All 3 copies on the board; hand already at MAX_HAND_SIZE (8).
    let b = createBoard();
    b = placeHireling(b, 1, inst("Doughboy", "b1", "love"));
    b = placeHireling(b, 3, inst("Doughboy", "b2", "love"));
    b = placeHireling(b, 5, inst("Doughboy", "b3", "love"));

    let h = createHand();
    for (let i = 0; i < 8; i++) {
      // Filler unrelated hirelings so the hand is full.
      h = addToHand(h, inst("Teacups" in {} ? "Doughboy" : "Doughboy", `filler-${i}`, "luck"));
    }

    const triple = findCharmableTriple(b, h)!;
    const beforeBoardIds = b.slots.map((s) => s?.id ?? null);
    expect(() =>
      mergeCharmableTriple(triple, { board: b, hand: h, pool: createInitialPool() }, "ch-1")
    ).toThrow(/overflow the hand/);

    // Board is untouched — we caught the overflow BEFORE removing anything.
    expect(b.slots.map((s) => s?.id ?? null)).toEqual(beforeBoardIds);
  });
});

describe("mergeIfCharmable", () => {
  test("returns charmed: null when no triple exists", () => {
    const result = mergeIfCharmable({
      board: createBoard(),
      hand: createHand(),
      pool: createInitialPool(),
    });
    expect(result.charmed).toBeNull();
  });

  test("performs the merge in one call when a triple is present", () => {
    let h = addToHand(createHand(), inst("Doughboy", "x1", "love"));
    h = addToHand(h, inst("Doughboy", "x2", "love"));
    h = addToHand(h, inst("Doughboy", "x3", "love"));
    const result = mergeIfCharmable(
      { board: createBoard(), hand: h, pool: createInitialPool() },
      (id) => `charmed-${id}-test`
    );
    expect(result.charmed?.id).toBe("charmed-doughboy-test");
    expect(result.hand.cards).toHaveLength(1);
    expect(result.charmed?.charmed).toBe(true);
  });
});
