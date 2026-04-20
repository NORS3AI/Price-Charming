import { ALL_HIRELINGS } from "../cards/hirelings";
import { createHirelingInstance } from "../board/hand";
import { mulberry32 } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import {
  assignHirelingPotion,
  assignPotionsToPool,
} from "../shop/assignment";
import { createInitialPool, poolHirelings, poolSpells } from "../shop/pool";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

describe("assignPotionsToPool", () => {
  test("every hireling instance ends with an active potion type", () => {
    const pool = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(1));
    for (const h of poolHirelings(pool)) {
      expect(h.potionType).not.toBeNull();
      expect(ACTIVE).toContain(h.potionType!);
    }
  });

  test("spells are left untouched (potionType still null)", () => {
    const pool = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(1));
    for (const s of poolSpells(pool)) {
      expect(s.potionType).toBeNull();
    }
  });

  test("deterministic under a seeded RNG", () => {
    const a = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(7));
    const b = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(7));
    expect(a.instances.map((i) => i.potionType)).toEqual(
      b.instances.map((i) => i.potionType)
    );
  });

  test("reshuffling produces a different distribution with a new seed", () => {
    const a = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(1));
    const b = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(2));
    expect(a.instances.map((i) => i.potionType)).not.toEqual(
      b.instances.map((i) => i.potionType)
    );
  });

  test("does not mutate the input pool", () => {
    const pool = createInitialPool();
    const snapshot = pool.instances.map((i) => i.potionType);
    assignPotionsToPool(pool, ACTIVE, mulberry32(5));
    expect(pool.instances.map((i) => i.potionType)).toEqual(snapshot);
  });

  test("rejects an empty active-type list", () => {
    expect(() => assignPotionsToPool(createInitialPool(), [], mulberry32(1))).toThrow();
  });

  test("distribution uses only active types across many reshuffles", () => {
    const types = new Set<PotionTypeId>();
    for (let s = 0; s < 5; s++) {
      const pool = assignPotionsToPool(createInitialPool(), ACTIVE, mulberry32(s));
      for (const h of poolHirelings(pool)) types.add(h.potionType!);
    }
    for (const t of types) expect(ACTIVE).toContain(t);
  });
});

describe("assignHirelingPotion", () => {
  test("assigns an active type to an individual hireling instance", () => {
    const dustyBroom = ALL_HIRELINGS.find((h) => h.name === "Dusty Broom")!;
    const inst = createHirelingInstance(dustyBroom, "starter");
    expect(inst.potionType).toBeNull();
    const assigned = assignHirelingPotion(inst, ACTIVE, mulberry32(1));
    expect(ACTIVE).toContain(assigned.potionType!);
    // Input untouched:
    expect(inst.potionType).toBeNull();
  });

  test("rejects an empty active-type list", () => {
    const dustyBroom = ALL_HIRELINGS.find((h) => h.name === "Dusty Broom")!;
    const inst = createHirelingInstance(dustyBroom, "starter");
    expect(() => assignHirelingPotion(inst, [], mulberry32(1))).toThrow();
  });
});
