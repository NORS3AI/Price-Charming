import { STARTER_SLOT } from "../board/board";
import { STARTING_GOLD } from "../economy/gold";
import { mulberry32 } from "../potions/rng";
import {
  FIRST_ROUND,
  MAX_ROUNDS,
  REPUTATION_MAX,
  REPUTATION_MIN,
} from "../game/types";
import { clampReputation, createGame } from "../game/state";
import { ACTIVE_POTION_COUNT } from "../potions/types";

describe("game constants", () => {
  test("match the spec envelope", () => {
    expect(MAX_ROUNDS).toBe(15);
    expect(FIRST_ROUND).toBe(1);
    expect(REPUTATION_MIN).toBe(-30);
    expect(REPUTATION_MAX).toBe(30);
  });
});

describe("createGame", () => {
  test("starts at round 1, shop phase, in progress", () => {
    const g = createGame({ rng: mulberry32(1) });
    expect(g.round).toBe(FIRST_ROUND);
    expect(g.phase).toBe("shop");
    expect(g.outcome).toBe("in-progress");
  });

  test("player starts with spec defaults (5g, 0 rep)", () => {
    const g = createGame({ rng: mulberry32(1) });
    expect(g.gold).toBe(STARTING_GOLD);
    expect(g.reputation).toBe(0);
  });

  test("picks exactly 5 active potion types", () => {
    const g = createGame({ rng: mulberry32(1) });
    expect(g.activePotionTypes.length).toBe(ACTIVE_POTION_COUNT);
    expect(new Set(g.activePotionTypes).size).toBe(ACTIVE_POTION_COUNT);
  });

  test("Dusty Broom is pre-placed at the center active slot with an active potion", () => {
    const g = createGame({ rng: mulberry32(1) });
    const broom = g.board.slots[STARTER_SLOT];
    expect(broom).not.toBeNull();
    expect(broom!.card.id).toBe("dusty-broom");
    expect(g.activePotionTypes).toContain(broom!.potionType!);
    expect(broom).toBe(g.starterBroom);
  });

  test("pool has every hireling assigned a potion type except spells", () => {
    const g = createGame({ rng: mulberry32(1) });
    for (const inst of g.pool.instances) {
      if (inst.card.kind === "hireling") {
        expect(inst.potionType).not.toBeNull();
        expect(g.activePotionTypes).toContain(inst.potionType!);
      } else {
        expect(inst.potionType).toBeNull();
      }
    }
  });

  test("prices default to 1g for every active type", () => {
    const g = createGame({ rng: mulberry32(1) });
    for (const t of g.activePotionTypes) {
      expect(g.prices.prices.get(t)).toBe(1);
    }
  });

  test("discovery starts empty and opponent null by default", () => {
    const g = createGame({ rng: mulberry32(1) });
    expect(g.discovery.seen.size).toBe(0);
    expect(g.opponent).toBeNull();
    expect(g.action).toBeNull();
  });

  test("is deterministic under a seeded RNG", () => {
    const a = createGame({ rng: mulberry32(42) });
    const b = createGame({ rng: mulberry32(42) });
    expect(a.activePotionTypes).toEqual(b.activePotionTypes);
    expect(a.starterBroom.potionType).toBe(b.starterBroom.potionType);
  });

  test("honours startingGold / startingReputation overrides", () => {
    const g = createGame({
      rng: mulberry32(1),
      startingGold: 15,
      startingReputation: 7,
    });
    expect(g.gold).toBe(15);
    expect(g.reputation).toBe(7);
  });

  test("clamps over-the-top starting reputation to the bar envelope", () => {
    const over = createGame({ rng: mulberry32(1), startingReputation: 99 });
    expect(over.reputation).toBe(REPUTATION_MAX);
    const under = createGame({ rng: mulberry32(1), startingReputation: -999 });
    expect(under.reputation).toBe(REPUTATION_MIN);
  });
});

describe("clampReputation", () => {
  test("clamps to [-30, 30]", () => {
    expect(clampReputation(5)).toBe(5);
    expect(clampReputation(-5)).toBe(-5);
    expect(clampReputation(40)).toBe(REPUTATION_MAX);
    expect(clampReputation(-40)).toBe(REPUTATION_MIN);
  });

  test("rejects NaN / Infinity", () => {
    expect(() => clampReputation(NaN)).toThrow();
    expect(() => clampReputation(Infinity)).toThrow();
  });
});
