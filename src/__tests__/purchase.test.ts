import { ALL_HIRELINGS } from "../cards/hirelings";
import { ALL_SPELLS } from "../cards/spells";
import { createBoard, placeHireling } from "../board/board";
import {
  addToHand,
  createHand,
  createHirelingInstance,
  createSpellInstance,
  handSize,
  MAX_HAND_SIZE,
} from "../board/hand";
import { createDustyBroomInstance } from "../board/starter";
import {
  COST_HIRELING,
  COST_REFRESH,
  COST_SPELL,
  SELL_VALUE,
} from "../economy/gold";
import { mulberry32 } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { assignPotionsToPool } from "../shop/assignment";
import { rollShop, offeringInstances } from "../shop/offering";
import { countOfCard, createInitialPool, isInPool, poolSize } from "../shop/pool";
import {
  buyHirelingFromShop,
  buySpellFromShop,
  refreshShopWithCost,
  sellHirelingFromBoardToPool,
  sellHirelingFromHandToPool,
} from "../shop/purchase";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

function rolledShop(round: number, seed: number) {
  const pool = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(seed));
  return rollShop(pool, round, mulberry32(seed + 100), { spellChance: 0.5 });
}

describe("buyHirelingFromShop", () => {
  test("moves a hireling into the hand, deducts 4g, clears the shop slot", () => {
    const { offering, pool } = rolledShop(3, 1);
    const hirelingSlot = offering.slots.findIndex(
      (s) => s?.card.kind === "hireling"
    );
    expect(hirelingSlot).toBeGreaterThanOrEqual(0);

    const res = buyHirelingFromShop(offering, hirelingSlot, createHand(), 10);
    expect(res.gold).toBe(10 - COST_HIRELING);
    expect(handSize(res.hand)).toBe(1);
    expect(res.offering.slots[hirelingSlot]).toBeNull();

    // The hireling in hand carries the pool's potion assignment.
    const hireling = res.hand.cards[0];
    expect(hireling.card.kind).toBe("hireling");
    if (hireling.card.kind === "hireling") {
      expect(ACTIVE).toContain(
        (hireling as { potionType: PotionTypeId }).potionType
      );
    }
    void pool;
  });

  test("rejects when the slot is a spell", () => {
    const { offering } = rolledShop(7, 2);
    const spellSlot = offering.slots.findIndex(
      (s) => s?.card.kind === "spell"
    );
    if (spellSlot === -1) return; // no spell this roll — skip

    expect(() =>
      buyHirelingFromShop(offering, spellSlot, createHand(), 10)
    ).toThrow(/not a hireling/);
  });

  test("rejects when gold is insufficient", () => {
    const { offering } = rolledShop(3, 3);
    const slot = offering.slots.findIndex((s) => s?.card.kind === "hireling");
    expect(() =>
      buyHirelingFromShop(offering, slot, createHand(), COST_HIRELING - 1)
    ).toThrow(/Not enough gold/);
  });

  test("rejects when the hand is full", () => {
    const { offering } = rolledShop(3, 4);
    const slot = offering.slots.findIndex((s) => s?.card.kind === "hireling");
    let hand = createHand();
    for (let i = 0; i < MAX_HAND_SIZE; i++) {
      hand = addToHand(
        hand,
        createHirelingInstance(
          ALL_HIRELINGS.find((h) => h.name === "Doughboy")!,
          `filler-${i}`
        )
      );
    }
    expect(() => buyHirelingFromShop(offering, slot, hand, 100)).toThrow(
      /hand is full/
    );
  });
});

describe("buySpellFromShop", () => {
  test("moves a spell into the hand and deducts 2g", () => {
    // Force a spell into the roll.
    const pool = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(1));
    const rolled = rollShop(pool, 7, mulberry32(2), { spellChance: 1 });
    const spellSlot = rolled.offering.slots.findIndex(
      (s) => s?.card.kind === "spell"
    );
    expect(spellSlot).toBeGreaterThanOrEqual(0);

    const res = buySpellFromShop(rolled.offering, spellSlot, createHand(), 5);
    expect(res.gold).toBe(5 - COST_SPELL);
    expect(handSize(res.hand)).toBe(1);
    expect(res.hand.cards[0].card.kind).toBe("spell");
  });

  test("rejects when the slot is a hireling", () => {
    const { offering } = rolledShop(1, 5);
    const hSlot = offering.slots.findIndex((s) => s?.card.kind === "hireling");
    expect(() => buySpellFromShop(offering, hSlot, createHand(), 10)).toThrow(
      /not a spell/
    );
  });
});

describe("refreshShopWithCost", () => {
  test("deducts 1g and produces a new offering", () => {
    const pool = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(1));
    const rolled = rollShop(pool, 3, mulberry32(2));
    const res = refreshShopWithCost(
      rolled.offering,
      rolled.pool,
      3,
      mulberry32(7),
      5
    );
    expect(res.gold).toBe(5 - COST_REFRESH);
    expect(offeringInstances(res.offering).length).toBeGreaterThan(0);
  });

  test("rejects when gold is insufficient", () => {
    const pool = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(1));
    const rolled = rollShop(pool, 3, mulberry32(2));
    expect(() =>
      refreshShopWithCost(rolled.offering, rolled.pool, 3, mulberry32(7), 0)
    ).toThrow(/Not enough gold/);
  });
});

describe("selling returns to the pool", () => {
  test("sellHirelingFromHandToPool adds +1g and puts the copy back in the pool", () => {
    const { offering, pool } = rolledShop(3, 10);
    const slot = offering.slots.findIndex((s) => s?.card.kind === "hireling");
    const boughtId = offering.slots[slot]!.id;

    const bought = buyHirelingFromShop(offering, slot, createHand(), 10);
    expect(isInPool(pool, boughtId)).toBe(false);

    const sold = sellHirelingFromHandToPool(bought.hand, 0, pool, bought.gold);
    expect(sold.gold).toBe(bought.gold + SELL_VALUE);
    expect(isInPool(sold.pool, boughtId)).toBe(true);
    expect(handSize(sold.hand)).toBe(0);
  });

  test("sellHirelingFromBoardToPool empties the slot and returns to pool", () => {
    const { offering, pool } = rolledShop(3, 11);
    const slot = offering.slots.findIndex((s) => s?.card.kind === "hireling");
    const buy = buyHirelingFromShop(offering, slot, createHand(), 10);

    const placedBoard = placeHireling(
      createBoard(),
      3,
      buy.hand.cards[0] as Parameters<typeof placeHireling>[2]
    );
    const sold = sellHirelingFromBoardToPool(placedBoard, 3, pool, buy.gold);
    expect(sold.gold).toBe(buy.gold + SELL_VALUE);
    expect(sold.board.slots[3]).toBeNull();
    expect(isInPool(sold.pool, offering.slots[slot]!.id)).toBe(true);
  });

  test("selling Dusty Broom does NOT return it to the pool", () => {
    const dusty = ALL_HIRELINGS.find((h) => h.name === "Dusty Broom")!;
    const inst = createDustyBroomInstance(dusty);
    const board = placeHireling(createBoard(), 3, inst);
    const pool = createInitialPool();
    const poolBefore = poolSize(pool);

    const sold = sellHirelingFromBoardToPool(board, 3, pool, 5);
    expect(sold.gold).toBe(5 + SELL_VALUE);
    expect(sold.board.slots[3]).toBeNull();
    expect(poolSize(sold.pool)).toBe(poolBefore);
    expect(countOfCard(sold.pool, "dusty-broom")).toBe(0);
  });

  test("selling a spell is impossible (guarded by Phase 3)", () => {
    const polish = ALL_SPELLS.find((s) => s.name === "Potion Polish")!;
    const hand = addToHand(createHand(), createSpellInstance(polish, "s1"));
    const pool = createInitialPool();
    expect(() => sellHirelingFromHandToPool(hand, 0, pool, 0)).toThrow(
      /Spells cannot be sold/
    );
  });
});
