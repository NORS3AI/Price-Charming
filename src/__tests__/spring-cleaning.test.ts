import { ALL_SPELLS } from "../cards/spells";
import {
  addToHand,
  createHand,
  createSpellInstance,
} from "../board/hand";
import {
  castSpringCleaning,
  SPRING_CLEANING_ID,
  SPRING_CLEANING_UPGRADED_ID,
} from "../shop/spring-cleaning";
import {
  countOfCard,
  createInitialPool,
  poolHirelings,
} from "../shop/pool";

const baseCard = ALL_SPELLS.find((s) => s.id === SPRING_CLEANING_ID)!;
const upgradedCard = ALL_SPELLS.find(
  (s) => s.id === SPRING_CLEANING_UPGRADED_ID
)!;

function handWith(spellId: string, instanceId = "cast-1") {
  const card =
    spellId === SPRING_CLEANING_ID ? baseCard : upgradedCard;
  return addToHand(createHand(), createSpellInstance(card, instanceId));
}

describe("castSpringCleaning — base version", () => {
  test("removes every Low-wage hireling from the pool permanently", () => {
    const pool = createInitialPool();
    const lowBefore = poolHirelings(pool).filter(
      (h) => h.card.kind === "hireling" && h.card.wageTier === "Low"
    ).length;
    expect(lowBefore).toBeGreaterThan(0);

    const res = castSpringCleaning(handWith(SPRING_CLEANING_ID), 0, pool);
    const lowAfter = poolHirelings(res.pool).filter(
      (h) => h.card.kind === "hireling" && h.card.wageTier === "Low"
    ).length;

    expect(lowAfter).toBe(0);
    expect(res.removedHirelings.length).toBe(lowBefore);
    for (const inst of res.removedHirelings) {
      expect(inst.card.kind).toBe("hireling");
      if (inst.card.kind === "hireling") {
        expect(inst.card.wageTier).toBe("Low");
      }
    }
  });

  test("leaves Medium and High hirelings untouched", () => {
    const pool = createInitialPool();
    const medBefore = poolHirelings(pool).filter(
      (h) => h.card.kind === "hireling" && h.card.wageTier === "Medium"
    ).length;
    const highBefore = poolHirelings(pool).filter(
      (h) => h.card.kind === "hireling" && h.card.wageTier === "High"
    ).length;

    const res = castSpringCleaning(handWith(SPRING_CLEANING_ID), 0, pool);

    const medAfter = poolHirelings(res.pool).filter(
      (h) => h.card.kind === "hireling" && h.card.wageTier === "Medium"
    ).length;
    const highAfter = poolHirelings(res.pool).filter(
      (h) => h.card.kind === "hireling" && h.card.wageTier === "High"
    ).length;
    expect(medAfter).toBe(medBefore);
    expect(highAfter).toBe(highBefore);
  });

  test("consumes the cast spell and returns an upgraded copy to the pool", () => {
    const pool = createInitialPool();
    expect(countOfCard(pool, SPRING_CLEANING_UPGRADED_ID)).toBe(0);

    const res = castSpringCleaning(
      handWith(SPRING_CLEANING_ID, "cast-instance-1"),
      0,
      pool
    );

    expect(res.hand.cards.length).toBe(0);
    expect(countOfCard(res.pool, SPRING_CLEANING_UPGRADED_ID)).toBe(1);
    expect(res.upgradedPoolInstance).not.toBeNull();
    expect(res.upgradedPoolInstance!.card.id).toBe(
      SPRING_CLEANING_UPGRADED_ID
    );
  });

  test("two successive casts add two upgraded copies with unique ids", () => {
    let pool = createInitialPool();
    let hand = addToHand(
      createHand(),
      createSpellInstance(baseCard, "cast-1")
    );
    hand = addToHand(hand, createSpellInstance(baseCard, "cast-2"));

    let res = castSpringCleaning(hand, 0, pool);
    pool = res.pool;
    hand = res.hand;
    res = castSpringCleaning(hand, 0, pool);

    expect(countOfCard(res.pool, SPRING_CLEANING_UPGRADED_ID)).toBe(2);
    const ids = res.pool.instances
      .filter((i) => i.card.id === SPRING_CLEANING_UPGRADED_ID)
      .map((i) => i.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("castSpringCleaning — upgraded version", () => {
  test("removes every Medium-wage hireling from the pool permanently", () => {
    const pool = createInitialPool();
    const medBefore = poolHirelings(pool).filter(
      (h) => h.card.kind === "hireling" && h.card.wageTier === "Medium"
    ).length;
    expect(medBefore).toBeGreaterThan(0);

    const res = castSpringCleaning(
      handWith(SPRING_CLEANING_UPGRADED_ID),
      0,
      pool
    );
    const medAfter = poolHirelings(res.pool).filter(
      (h) => h.card.kind === "hireling" && h.card.wageTier === "Medium"
    ).length;
    expect(medAfter).toBe(0);
    expect(res.removedHirelings.length).toBe(medBefore);
  });

  test("does NOT return another upgraded copy to the pool", () => {
    const pool = createInitialPool();
    const res = castSpringCleaning(
      handWith(SPRING_CLEANING_UPGRADED_ID),
      0,
      pool
    );
    expect(res.upgradedPoolInstance).toBeNull();
    expect(countOfCard(res.pool, SPRING_CLEANING_UPGRADED_ID)).toBe(0);
  });
});

describe("castSpringCleaning — validation", () => {
  test("rejects when the hand card is a hireling", () => {
    const hand = addToHand(
      createHand(),
      createSpellInstance(baseCard, "ok")
    );
    // corrupt: put a non-spring-cleaning spell at a different index
    const polish = ALL_SPELLS.find((s) => s.name === "Potion Polish")!;
    const hand2 = addToHand(hand, createSpellInstance(polish, "polish"));

    expect(() => castSpringCleaning(hand2, 1, createInitialPool())).toThrow(
      /not a Spring Cleaning/
    );
  });

  test("rejects out-of-bounds hand indices", () => {
    expect(() =>
      castSpringCleaning(createHand(), 0, createInitialPool())
    ).toThrow(/not a spell/);
  });
});
