import { mulberry32 } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { assignPotionsToPool } from "../shop/assignment";
import {
  DEFAULT_SHOP_SIZE,
  createEmptyOffering,
  offeringHirelings,
  offeringInstances,
  offeringSpells,
  refreshShop,
  rollShop,
  takeFromOffering,
} from "../shop/offering";
import { createInitialPool, poolHirelings, poolSize } from "../shop/pool";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

describe("createEmptyOffering", () => {
  test("has the requested number of null slots", () => {
    const o = createEmptyOffering();
    expect(o.slots.length).toBe(DEFAULT_SHOP_SIZE);
    expect(o.slots.every((s) => s === null)).toBe(true);
  });

  test("custom size honoured", () => {
    expect(createEmptyOffering(3).slots.length).toBe(3);
  });
});

describe("rollShop", () => {
  test("fills as many slots as possible with unique, round-eligible instances", () => {
    const pool = createInitialPool();
    const res = rollShop(pool, 1, mulberry32(1));
    const picked = offeringInstances(res.offering);
    expect(picked.length).toBeGreaterThan(0);
    expect(picked.length).toBeLessThanOrEqual(DEFAULT_SHOP_SIZE);

    // All picks are unique instances.
    expect(new Set(picked.map((i) => i.id)).size).toBe(picked.length);

    // Every pick is round-eligible (round 1).
    for (const inst of picked) {
      if (inst.card.kind === "hireling") {
        expect(inst.card.roundAvailable).toBeLessThanOrEqual(1);
      } else {
        expect(
          inst.card.roundAvailable === null || inst.card.roundAvailable <= 1
        ).toBe(true);
      }
    }
  });

  test("pool shrinks by the number of picks", () => {
    const pool = createInitialPool();
    const res = rollShop(pool, 1, mulberry32(1));
    const picked = offeringInstances(res.offering).length;
    expect(poolSize(res.pool)).toBe(poolSize(pool) - picked);
  });

  test("at most one spell per roll", () => {
    for (let seed = 0; seed < 30; seed++) {
      const res = rollShop(createInitialPool(), 7, mulberry32(seed));
      expect(offeringSpells(res.offering).length).toBeLessThanOrEqual(1);
    }
  });

  test("with spellChance 0, never rolls a spell", () => {
    for (let seed = 0; seed < 10; seed++) {
      const res = rollShop(createInitialPool(), 7, mulberry32(seed), {
        spellChance: 0,
      });
      expect(offeringSpells(res.offering).length).toBe(0);
    }
  });

  test("with spellChance 1 at a round with eligible spells, always rolls one spell", () => {
    for (let seed = 0; seed < 10; seed++) {
      const res = rollShop(createInitialPool(), 7, mulberry32(seed), {
        spellChance: 1,
      });
      expect(offeringSpells(res.offering).length).toBe(1);
      expect(offeringHirelings(res.offering).length).toBe(
        DEFAULT_SHOP_SIZE - 1
      );
    }
  });

  test("deterministic under a seeded RNG", () => {
    const a = rollShop(createInitialPool(), 3, mulberry32(9));
    const b = rollShop(createInitialPool(), 3, mulberry32(9));
    expect(a.offering.slots.map((s) => s?.id ?? null)).toEqual(
      b.offering.slots.map((s) => s?.id ?? null)
    );
  });

  test("round 1 never offers round-6 Spring Cleaning", () => {
    for (let seed = 0; seed < 20; seed++) {
      const res = rollShop(createInitialPool(), 1, mulberry32(seed), {
        spellChance: 1,
      });
      const ids = offeringInstances(res.offering).map((i) => i.card.id);
      expect(ids).not.toContain("spring-cleaning");
    }
  });

  test("spells do not always land in slot 0 — positions are shuffled", () => {
    // With spellChance=1 every roll has a spell; its slot should vary by seed.
    const positions = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      const res = rollShop(createInitialPool(), 7, mulberry32(seed), {
        spellChance: 1,
      });
      const spellIdx = res.offering.slots.findIndex(
        (s) => s !== null && s.card.kind === "spell"
      );
      positions.add(spellIdx);
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("refreshShop", () => {
  test("returns the old offering to the pool and rerolls", () => {
    const pool0 = createInitialPool();
    const rolled = rollShop(pool0, 3, mulberry32(1));
    const drawn = offeringInstances(rolled.offering).length;

    const refreshed = refreshShop(
      rolled.offering,
      rolled.pool,
      3,
      mulberry32(2)
    );
    const drawnAgain = offeringInstances(refreshed.offering).length;

    // Pool size should reflect: original - refreshed-offering count.
    expect(poolSize(refreshed.pool)).toBe(poolSize(pool0) - drawnAgain);

    // Nothing stays from the previous offering by identity unless it was
    // legitimately redrawn — which is vanishingly rare. Just check sizes
    // add up deterministically above.
    void drawn;
  });

  test("is deterministic for the same seeds", () => {
    const pool0 = createInitialPool();
    const a = refreshShop(
      rollShop(pool0, 3, mulberry32(1)).offering,
      rollShop(pool0, 3, mulberry32(1)).pool,
      3,
      mulberry32(2)
    );
    const b = refreshShop(
      rollShop(pool0, 3, mulberry32(1)).offering,
      rollShop(pool0, 3, mulberry32(1)).pool,
      3,
      mulberry32(2)
    );
    expect(a.offering.slots.map((s) => s?.id ?? null)).toEqual(
      b.offering.slots.map((s) => s?.id ?? null)
    );
  });
});

describe("refresh preserves potion-type assignments (spec: only shop-phase advance reshuffles)", () => {
  test("hireling potion types are stable across a refresh", () => {
    const assigned = assignPotionsToPool(
      createInitialPool(),
      ACTIVE,
      mulberry32(1)
    );
    const snapshot = new Map(
      poolHirelings(assigned).map((i) => [i.id, i.potionType])
    );

    const rolled = rollShop(assigned, 3, mulberry32(2));
    const refreshed = refreshShop(
      rolled.offering,
      rolled.pool,
      3,
      mulberry32(3)
    );

    // Every hireling still in the pool or in the new offering carries its
    // original potion type.
    const currentHirelings = [
      ...poolHirelings(refreshed.pool),
      ...offeringHirelings(refreshed.offering),
    ];
    for (const h of currentHirelings) {
      expect(h.potionType).toBe(snapshot.get(h.id));
    }
  });
});

describe("takeFromOffering", () => {
  test("removes the instance at the slot", () => {
    const rolled = rollShop(createInitialPool(), 3, mulberry32(1));
    const beforeInstances = offeringInstances(rolled.offering).length;

    const res = takeFromOffering(rolled.offering, 0);
    expect(res.taken.id).toBe(rolled.offering.slots[0]?.id);
    expect(res.offering.slots[0]).toBeNull();
    expect(offeringInstances(res.offering).length).toBe(beforeInstances - 1);
  });

  test("throws when the slot is empty", () => {
    const offering = createEmptyOffering(3);
    expect(() => takeFromOffering(offering, 0)).toThrow(/empty/);
  });

  test("throws when slot is out of range", () => {
    const offering = createEmptyOffering(3);
    expect(() => takeFromOffering(offering, -1)).toThrow();
    expect(() => takeFromOffering(offering, 3)).toThrow();
  });
});
