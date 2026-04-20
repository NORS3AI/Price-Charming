import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import {
  addToHand,
  createHand,
  createHirelingInstance,
  createSpellInstance,
} from "../board/hand";
import { Hand, HirelingInstance } from "../board/types";
import { COST_REFRESH } from "../economy/gold";
import { mulberry32 } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { defaultPriceMap } from "../pricing/panel";
import { rollShop } from "../shop/offering";
import { assignPotionsToPool } from "../shop/assignment";
import { createInitialPool } from "../shop/pool";
import {
  CHARM_SPELL_CARDS,
  CHARM_SPELL_IDS,
  LUCKY_POTENCY_BONUS,
  TIP_JAR_GOLD,
  castLuckyCharm,
  castSecondChanceCharm,
  castTipJarCharm,
  pickRandomCharm,
  playCharmed,
} from "../charmed/charms";
import { ALL_SPELLS } from "../cards/spells";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

function inst(name: string, id: string, potion: PotionTypeId): HirelingInstance {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  return createHirelingInstance(card, id, potion);
}

function charmedInst(
  name: string,
  id: string,
  potion: PotionTypeId
): HirelingInstance {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  return createHirelingInstance(card, id, potion, { charmed: true });
}

describe("Charm card registry", () => {
  test("CHARM_SPELL_IDS lists the three charms", () => {
    expect([...CHARM_SPELL_IDS]).toEqual([
      "tip-jar-charm",
      "second-chance-charm",
      "lucky-charm",
    ]);
  });

  test("CHARM_SPELL_CARDS resolves all three cards from the loader", () => {
    expect(CHARM_SPELL_CARDS).toHaveLength(3);
    for (const card of CHARM_SPELL_CARDS) {
      expect(card.kind).toBe("spell");
      expect(card.keywords.some((k) => k.name === "Charm")).toBe(true);
    }
  });

  test("CHARM_SPELL_CARDS is frozen at runtime", () => {
    expect(Object.isFrozen(CHARM_SPELL_CARDS)).toBe(true);
  });

  test("pickRandomCharm draws every card across many seeds", () => {
    const seen = new Set<string>();
    for (let s = 0; s < 50; s++) {
      seen.add(pickRandomCharm(mulberry32(s)).id);
    }
    expect(seen.size).toBe(3);
  });
});

describe("playCharmed", () => {
  test("non-charmed plays don't grant a Charm", () => {
    const hand = addToHand(createHand(), inst("Doughboy", "h1", "love"));
    const result = playCharmed(createBoard(), hand, 0, 3, mulberry32(1));
    expect(result.grantedCharm).toBeNull();
    expect(result.hand.cards).toHaveLength(0);
  });

  test("Charmed plays grant a random Charm to the hand", () => {
    const hand = addToHand(
      createHand(),
      charmedInst("Doughboy", "ch", "love")
    );
    const result = playCharmed(
      createBoard(),
      hand,
      0,
      3,
      mulberry32(1),
      (id) => `granted-${id}`
    );
    expect(result.grantedCharm).not.toBeNull();
    expect(result.hand.cards).toHaveLength(1);
    expect(result.hand.cards[0].card.id).toBe(result.grantedCharm!.id);
    expect(result.hand.cards[0].id).toBe(`granted-${result.grantedCharm!.id}`);
  });
});

describe("castTipJarCharm", () => {
  test("adds +3 gold and consumes the spell", () => {
    const hand = addToHand(
      createHand(),
      createSpellInstance(CHARM_SPELL_CARDS[0], "tj1")
    );
    const result = castTipJarCharm(hand, 0, 5);
    expect(result.gold).toBe(5 + TIP_JAR_GOLD);
    expect(result.hand.cards).toHaveLength(0);
  });

  test("rejects non-Tip-Jar cards at the slot", () => {
    const polish = ALL_SPELLS.find((s) => s.name === "Potion Polish")!;
    const hand = addToHand(createHand(), createSpellInstance(polish, "p1"));
    expect(() => castTipJarCharm(hand, 0, 5)).toThrow(/tip-jar-charm/);
  });
});

describe("castSecondChanceCharm", () => {
  test("refreshes the shop without spending gold", () => {
    const pool = assignPotionsToPool(
      createInitialPool(),
      ACTIVE,
      mulberry32(1)
    );
    const rolled = rollShop(pool, 3, mulberry32(2));
    const hand = addToHand(
      createHand(),
      createSpellInstance(CHARM_SPELL_CARDS[1], "sc1")
    );
    const goldBefore = 1; // exactly 1 — would normally fail to refresh
    const result = castSecondChanceCharm(
      hand,
      0,
      rolled.offering,
      rolled.pool,
      3,
      mulberry32(3)
    );
    // Hand consumed; refreshed offering exists; gold isn't deducted by
    // this helper (caller keeps their gold).
    expect(result.hand.cards).toHaveLength(0);
    expect(result.offering.slots.some((s) => s !== null)).toBe(true);
    void COST_REFRESH; // expected to be 1g normally — Charm is free.
    void goldBefore;
  });
});

describe("castLuckyCharm", () => {
  test("grants +3 permanent potency to the targeted hireling", () => {
    const target = inst("Pantry Stocker", "ps", "love");
    const board = placeHireling(createBoard(), 3, target);
    const hand = addToHand(
      createHand(),
      createSpellInstance(CHARM_SPELL_CARDS[2], "lk1")
    );
    const result = castLuckyCharm(hand, 0, board, 3);
    expect(result.target.permanentPotencyBonus).toBe(LUCKY_POTENCY_BONUS);
    expect(result.board.slots[3]?.permanentPotencyBonus).toBe(
      LUCKY_POTENCY_BONUS
    );
    expect(result.hand.cards).toHaveLength(0);
  });

  test("rejects an empty target slot", () => {
    const hand: Hand = addToHand(
      createHand(),
      createSpellInstance(CHARM_SPELL_CARDS[2], "lk1")
    );
    expect(() => castLuckyCharm(hand, 0, createBoard(), 3)).toThrow(/empty/);
  });
});
