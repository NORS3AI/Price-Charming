import { ALL_HIRELINGS } from "../cards/hirelings";
import { ALL_SPELLS } from "../cards/spells";
import {
  countOfCard,
  createInitialPool,
  instanceIdFor,
  isHirelingPoolInstance,
  isInPool,
  isSpellPoolInstance,
  poolAvailableAtRound,
  poolHirelings,
  poolSize,
  poolSpells,
  removeFromPoolWhere,
  returnToPool,
  takeFromPool,
} from "../shop/pool";

const pool = createInitialPool();

describe("createInitialPool", () => {
  test("excludes Dusty Broom entirely", () => {
    expect(countOfCard(pool, "dusty-broom")).toBe(0);
  });

  test("excludes Charm spells (poolCount null)", () => {
    const charmIds = ALL_SPELLS.filter((s) => s.poolCount === null).map(
      (s) => s.id
    );
    expect(charmIds.length).toBeGreaterThan(0);
    for (const id of charmIds) {
      expect(countOfCard(pool, id)).toBe(0);
    }
  });

  test("every other hireling contributes exactly poolCount copies", () => {
    for (const card of ALL_HIRELINGS) {
      if (card.id === "dusty-broom") continue;
      expect(countOfCard(pool, card.id)).toBe(card.poolCount);
    }
  });

  test("every pooled spell contributes exactly poolCount copies (except the upgraded form)", () => {
    for (const card of ALL_SPELLS) {
      if (card.poolCount === null) continue;
      if (card.id === "spring-cleaning-upgraded") {
        expect(countOfCard(pool, card.id)).toBe(0);
        continue;
      }
      expect(countOfCard(pool, card.id)).toBe(card.poolCount);
    }
  });

  test("total pool size matches the sum of pool counts (excluding upgraded Spring Cleaning)", () => {
    let expected = 0;
    for (const card of ALL_HIRELINGS) {
      if (card.id !== "dusty-broom") expected += card.poolCount;
    }
    for (const card of ALL_SPELLS) {
      if (card.poolCount === null) continue;
      if (card.id === "spring-cleaning-upgraded") continue;
      expected += card.poolCount;
    }
    expect(poolSize(pool)).toBe(expected);
  });

  test("Spring Cleaning (Upgraded) starts outside the pool", () => {
    expect(countOfCard(pool, "spring-cleaning-upgraded")).toBe(0);
  });

  test("every pool instance has a distinct id and a null potion type", () => {
    const ids = new Set(pool.instances.map((i) => i.id));
    expect(ids.size).toBe(pool.instances.length);
    for (const inst of pool.instances) {
      expect(inst.potionType).toBeNull();
    }
  });

  test("instance ids follow the `<card-id>#<n>` pattern", () => {
    const doughboy = pool.instances.filter((i) => i.card.id === "doughboy");
    expect(doughboy.length).toBe(4);
    expect(doughboy.map((i) => i.id)).toEqual([
      "doughboy#0",
      "doughboy#1",
      "doughboy#2",
      "doughboy#3",
    ]);
  });
});

describe("narrowing helpers", () => {
  test("poolHirelings / poolSpells split the pool by kind", () => {
    const hirelings = poolHirelings(pool);
    const spells = poolSpells(pool);
    expect(hirelings.length + spells.length).toBe(poolSize(pool));
    for (const h of hirelings) expect(isHirelingPoolInstance(h)).toBe(true);
    for (const s of spells) expect(isSpellPoolInstance(s)).toBe(true);
  });
});

describe("poolAvailableAtRound", () => {
  test("round 1 reveals only round-1 hirelings and unrounded general spells", () => {
    const r1 = poolAvailableAtRound(pool, 1);
    for (const inst of r1) {
      if (inst.card.kind === "hireling") {
        expect(inst.card.roundAvailable).toBeLessThanOrEqual(1);
      } else {
        expect(
          inst.card.roundAvailable === null || inst.card.roundAvailable <= 1
        ).toBe(true);
      }
    }
    // Spring Cleaning (round 6) is NOT yet available.
    expect(r1.some((i) => i.card.id === "spring-cleaning")).toBe(false);
    // Potion Polish (general spell, roundAvailable null) IS.
    expect(r1.some((i) => i.card.id === "potion-polish")).toBe(true);
  });

  test("Spring Cleaning becomes available at round 6", () => {
    expect(
      poolAvailableAtRound(pool, 5).some((i) => i.card.id === "spring-cleaning")
    ).toBe(false);
    expect(
      poolAvailableAtRound(pool, 6).some((i) => i.card.id === "spring-cleaning")
    ).toBe(true);
  });

  test("round 10 reveals every pool card", () => {
    const r10 = poolAvailableAtRound(pool, 10);
    expect(r10.length).toBe(poolSize(pool));
  });
});

describe("take / return", () => {
  test("takeFromPool removes the instance and returns it", () => {
    const target = pool.instances[0];
    const res = takeFromPool(pool, target.id);
    expect(res.taken).toBe(target);
    expect(poolSize(res.pool)).toBe(poolSize(pool) - 1);
    expect(isInPool(res.pool, target.id)).toBe(false);
  });

  test("takeFromPool throws on unknown ids", () => {
    expect(() => takeFromPool(pool, "not-a-real-id")).toThrow(/not in the pool/);
  });

  test("returnToPool re-adds the instance", () => {
    const target = pool.instances[0];
    const { pool: afterTake } = takeFromPool(pool, target.id);
    const afterReturn = returnToPool(afterTake, target);
    expect(poolSize(afterReturn)).toBe(poolSize(pool));
    expect(isInPool(afterReturn, target.id)).toBe(true);
  });

  test("returnToPool refuses duplicates", () => {
    expect(() => returnToPool(pool, pool.instances[0])).toThrow(
      /already in the pool/
    );
  });
});

describe("removeFromPoolWhere", () => {
  test("removes every matching instance and reports them", () => {
    const res = removeFromPoolWhere(
      pool,
      (i) => i.card.kind === "hireling" && i.card.wageTier === "Low"
    );
    expect(res.removed.every((i) => i.card.kind === "hireling")).toBe(true);
    expect(poolSize(res.pool) + res.removed.length).toBe(poolSize(pool));
    // Nothing removed remains:
    for (const r of res.removed) {
      expect(isInPool(res.pool, r.id)).toBe(false);
    }
  });

  test("returns identical size when nothing matches", () => {
    const res = removeFromPoolWhere(pool, () => false);
    expect(res.removed).toEqual([]);
    expect(poolSize(res.pool)).toBe(poolSize(pool));
  });
});

describe("instanceIdFor", () => {
  test("formats card ids consistently", () => {
    const doughboy = ALL_HIRELINGS.find((h) => h.name === "Doughboy")!;
    expect(instanceIdFor(doughboy, 0)).toBe("doughboy#0");
    expect(instanceIdFor(doughboy, 3)).toBe("doughboy#3");
  });
});
