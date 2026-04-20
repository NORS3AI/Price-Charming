import {
  ACTIVE_POTION_COUNT,
  POTION_TYPES,
  getPotionMeta,
  PotionTypeId,
} from "../potions/types";
import { selectActivePotionTypes } from "../potions/selection";
import {
  createDiscovery,
  discoveredCount,
  isSeen,
  markSeen,
  markSeenMany,
} from "../potions/discovery";
import { mulberry32, shuffle } from "../potions/rng";

describe("potion types", () => {
  test("all 7 types present with unique ids and icons", () => {
    expect(POTION_TYPES.length).toBe(7);
    const ids = POTION_TYPES.map((p) => p.id);
    const icons = POTION_TYPES.map((p) => p.icon);
    expect(new Set(ids).size).toBe(7);
    expect(new Set(icons).size).toBe(7);
  });

  test("POTION_TYPES is frozen at runtime", () => {
    expect(Object.isFrozen(POTION_TYPES)).toBe(true);
  });

  test("getPotionMeta looks up by id", () => {
    expect(getPotionMeta("love")?.name).toBe("Love Potion");
    expect(getPotionMeta("flutterfix")?.icon).toBe("🪽");
    expect(getPotionMeta("nonsense" as PotionTypeId)).toBeUndefined();
  });
});

describe("selectActivePotionTypes", () => {
  test("returns exactly 5 unique potion type ids", () => {
    const active = selectActivePotionTypes(mulberry32(1));
    expect(active.length).toBe(ACTIVE_POTION_COUNT);
    expect(new Set(active).size).toBe(ACTIVE_POTION_COUNT);
    for (const id of active) {
      expect(POTION_TYPES.some((p) => p.id === id)).toBe(true);
    }
  });

  test("is deterministic under a seeded RNG", () => {
    const a = selectActivePotionTypes(mulberry32(42));
    const b = selectActivePotionTypes(mulberry32(42));
    expect(a).toEqual(b);
  });

  test("distribution across seeds includes every type eventually", () => {
    const seen = new Set<PotionTypeId>();
    for (let s = 0; s < 50; s++) {
      for (const id of selectActivePotionTypes(mulberry32(s))) seen.add(id);
    }
    expect(seen.size).toBe(7);
  });
});

describe("shuffle", () => {
  test("does not mutate the input", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, mulberry32(1));
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect(out).not.toBe(input);
  });

  test("permutation (same multiset)", () => {
    const out = shuffle([1, 2, 3, 4, 5], mulberry32(1));
    expect(out.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });

  test("seed stability", () => {
    const a = shuffle([1, 2, 3, 4, 5], mulberry32(7));
    const b = shuffle([1, 2, 3, 4, 5], mulberry32(7));
    expect(a).toEqual(b);
  });
});

describe("discovery tracker", () => {
  test("starts empty", () => {
    const d = createDiscovery();
    expect(discoveredCount(d)).toBe(0);
    expect(isSeen(d, "love")).toBe(false);
  });

  test("markSeen adds ids without mutating the input", () => {
    const d0 = createDiscovery();
    const d1 = markSeen(d0, "love");
    expect(isSeen(d1, "love")).toBe(true);
    expect(isSeen(d0, "love")).toBe(false);
  });

  test("markSeen on an already-seen id returns the same object", () => {
    const d1 = markSeen(createDiscovery(), "luck");
    expect(markSeen(d1, "luck")).toBe(d1);
  });

  test("markSeenMany folds in a batch, returning the same object when nothing is new", () => {
    const d1 = markSeenMany(createDiscovery(), ["love", "luck"]);
    expect(discoveredCount(d1)).toBe(2);
    const d2 = markSeenMany(d1, ["luck"]);
    expect(d2).toBe(d1);
    const d3 = markSeenMany(d1, ["luck", "flutterfix"]);
    expect(discoveredCount(d3)).toBe(3);
  });
});
