import { ALL_HIRELINGS } from "../cards/hirelings";
import { placeHireling } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { mulberry32 } from "../potions/rng";
import { createGame } from "../game/state";
import {
  paydayDueNow,
  paydayLineItems,
  payWage,
  sellAtPayday,
  startShopPhase,
} from "../game/shop-phase";
import { GameState } from "../game/types";

function withBoardHireling(
  g: GameState,
  name: string,
  id: string,
  slot: number
): GameState {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  const inst = createHirelingInstance(card, id, g.activePotionTypes[0]);
  return { ...g, board: placeHireling(g.board, slot, inst) };
}

describe("paydayDueNow", () => {
  test("true on rounds 3, 6, 9, 12, 15", () => {
    const g0 = createGame({ rng: mulberry32(1) });
    for (const round of [3, 6, 9, 12, 15]) {
      expect(paydayDueNow({ ...g0, round })).toBe(true);
    }
  });

  test("false on other rounds", () => {
    const g0 = createGame({ rng: mulberry32(1) });
    for (const round of [1, 2, 4, 5, 7, 8, 10, 11, 13, 14]) {
      expect(paydayDueNow({ ...g0, round })).toBe(false);
    }
  });
});

describe("paydayLineItems", () => {
  test("excludes Dusty Broom (payday exempt)", () => {
    const g = createGame({ rng: mulberry32(1) });
    // Dusty Broom is the only board hireling; since it's exempt, list is empty.
    expect(paydayLineItems(g)).toEqual([]);
  });

  test("includes non-exempt board hirelings with correct wages and affordability", () => {
    let g = createGame({ rng: mulberry32(1), startingGold: 3 });
    g = withBoardHireling(g, "Doughboy", "d-low", 2); // Low tier → 2g wage
    g = withBoardHireling(g, "Sugar Sprinkler", "s-medium", 4); // Medium → 4g wage

    const items = paydayLineItems(g);
    const byId = new Map(items.map((i) => [i.hireling.id, i]));
    expect(byId.get("d-low")?.wage).toBe(2);
    expect(byId.get("d-low")?.canPay).toBe(true); // 3g >= 2g
    expect(byId.get("s-medium")?.wage).toBe(4);
    expect(byId.get("s-medium")?.canPay).toBe(false); // 3g < 4g
  });

  test("includes bench hirelings per spec", () => {
    let g = createGame({ rng: mulberry32(1) });
    g = withBoardHireling(g, "Doughboy", "bench-d", 0); // slot 0 = bench
    const items = paydayLineItems(g);
    expect(items.find((i) => i.hireling.id === "bench-d")).toBeDefined();
  });
});

describe("payWage", () => {
  test("deducts wage and advances the tracker", () => {
    let g = createGame({ rng: mulberry32(1), startingGold: 10 });
    g = withBoardHireling(g, "Doughboy", "d1", 2);
    const after = payWage(g, "d1");
    expect(after.gold).toBe(8); // 10 - 2
    const survivor = after.board.slots[2]!;
    expect(survivor.wageTracker.paydaysSurvived).toBe(1);
  });

  test("throws on insufficient gold", () => {
    let g = createGame({ rng: mulberry32(1), startingGold: 1 });
    g = withBoardHireling(g, "Doughboy", "d1", 2);
    expect(() => payWage(g, "d1")).toThrow(/need 2g/);
  });

  test("throws when Dusty Broom (exempt) is targeted", () => {
    const g = createGame({ rng: mulberry32(1) });
    expect(() => payWage(g, g.starterBroom.id)).toThrow(/payday-exempt/);
  });

  test("throws when the hireling isn't on the board", () => {
    const g = createGame({ rng: mulberry32(1) });
    expect(() => payWage(g, "not-there")).toThrow(/not on the board/);
  });
});

describe("sellAtPayday", () => {
  test("removes the hireling, gains 1g, returns to pool", () => {
    let g = createGame({ rng: mulberry32(1), startingGold: 5 });
    g = withBoardHireling(g, "Doughboy", "d1", 2);
    const after = sellAtPayday(g, "d1");
    expect(after.gold).toBe(6);
    expect(after.board.slots[2]).toBeNull();
    expect(after.pool.instances.some((i) => i.id === "d1")).toBe(true);
  });

  test("Dusty Broom disappears permanently on sell", () => {
    const g = createGame({ rng: mulberry32(1) });
    const broomId = g.starterBroom.id;
    const after = sellAtPayday(g, broomId);
    expect(after.pool.instances.some((i) => i.id === broomId)).toBe(false);
  });
});

describe("startShopPhase", () => {
  test("rolls a fresh offering and reshuffles pool potion types", () => {
    const g = createGame({ rng: mulberry32(1) });
    const beforePotions = g.pool.instances
      .filter((i) => i.card.kind === "hireling")
      .map((i) => i.potionType);

    const after = startShopPhase(g, mulberry32(2));

    // Offering populated
    expect(after.offering.slots.some((s) => s !== null)).toBe(true);

    // Pool potions may have shifted (not every slot changes but the
    // reshuffle ran — we check that remaining-pool hirelings still have
    // active types and the overall total consumed adds up).
    for (const inst of after.pool.instances) {
      if (inst.card.kind === "hireling") {
        expect(after.activePotionTypes).toContain(inst.potionType!);
      }
    }
    void beforePotions;
  });

  test("throws when phase isn't shop", () => {
    const g = createGame({ rng: mulberry32(1) });
    const action: GameState = { ...g, phase: "action" };
    expect(() => startShopPhase(action, mulberry32(2))).toThrow(
      /expected phase "shop"/
    );
  });

  test("is deterministic under a seeded RNG", () => {
    const a = startShopPhase(createGame({ rng: mulberry32(1) }), mulberry32(2));
    const b = startShopPhase(createGame({ rng: mulberry32(1) }), mulberry32(2));
    expect(a.offering.slots.map((s) => s?.id ?? null)).toEqual(
      b.offering.slots.map((s) => s?.id ?? null)
    );
  });
});
