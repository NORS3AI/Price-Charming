import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { Board } from "../board/types";
import { PotionTypeId } from "../potions/types";
import {
  CAP_POTENCY,
  MAX_PRICE,
  MIN_PRICE,
} from "../pricing/brackets";
import {
  applyHaggle,
  buildPricingPanel,
  defaultPriceMap,
  priceFor,
  setPrice,
} from "../pricing/panel";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

function placeAt(
  board: Board,
  slot: number,
  cardName: string,
  potionType: PotionTypeId | null
): Board {
  const card = ALL_HIRELINGS.find((h) => h.name === cardName)!;
  return placeHireling(
    board,
    slot,
    createHirelingInstance(card, `${cardName}-${slot}`, potionType)
  );
}

describe("price map basics", () => {
  test("defaults every active type to MIN_PRICE", () => {
    const map = defaultPriceMap(ACTIVE);
    for (const t of ACTIVE) expect(priceFor(map, t)).toBe(MIN_PRICE);
  });

  test("inactive types have no entry", () => {
    const map = defaultPriceMap(["love", "luck"]);
    expect(map.prices.has("love")).toBe(true);
    expect(map.prices.has("flutterfix")).toBe(false);
  });
});

describe("setPrice", () => {
  test("clamps to [MIN_PRICE, maxAllowed] and returns a new map", () => {
    const map = defaultPriceMap(ACTIVE);
    const after = setPrice(map, "love", 5, 3);
    expect(priceFor(after, "love")).toBe(3); // clamped down
    expect(priceFor(map, "love")).toBe(MIN_PRICE); // input untouched

    const tooLow = setPrice(map, "love", 0, 5);
    expect(priceFor(tooLow, "love")).toBe(MIN_PRICE);
  });

  test("rejects non-integer prices", () => {
    const map = defaultPriceMap(ACTIVE);
    expect(() => setPrice(map, "love", 2.5, 5)).toThrow();
  });

  test("rejects unknown potion types", () => {
    const map = defaultPriceMap(ACTIVE);
    expect(() =>
      setPrice(map, "half-curse-cure", 2, 5)
    ).toThrow(/not in the price map/);
  });
});

describe("buildPricingPanel", () => {
  test("reports zero potency, zero max, no-stock status when nothing sells the type", () => {
    const map = defaultPriceMap(ACTIVE);
    const rows = buildPricingPanel(ACTIVE, createBoard(), map);
    for (const row of rows) {
      expect(row.combinedPotency).toBe(0);
      expect(row.currentMax).toBe(0);
      expect(row.effectivePrice).toBe(0);
      expect(row.status).toEqual({ kind: "no-stock" });
    }
  });

  test("computes max price and below-cap status from active hirelings", () => {
    let b = createBoard();
    // Two Sugar Sprinklers (potency 5 each) sell Love → combined 10 → max 2g.
    b = placeAt(b, 2, "Sugar Sprinkler", "love");
    b = placeAt(b, 3, "Sugar Sprinkler", "love");

    const rows = buildPricingPanel(ACTIVE, b, defaultPriceMap(ACTIVE));
    const love = rows.find((r) => r.potionType === "love")!;
    expect(love.combinedPotency).toBe(10);
    expect(love.currentMax).toBe(2);
    expect(love.status).toEqual({
      kind: "below-cap",
      potencyToNextTier: 7, // 10 → next bracket 17
    });
  });

  test("at-cap status when combined potency >= 63", () => {
    // The CSV alone tops out around 10 potency per slot, so reaching the
    // 63 cap requires permanent buffs in gameplay. Simulate a fully
    // buffed board with a tweaked card clone.
    const muffin = ALL_HIRELINGS.find((h) => h.name === "The Muffin Man")!;
    const buffed = { ...muffin, potions: [{ stock: 10, potency: 13 }] };
    let b = createBoard();
    for (let i = 0; i < 5; i++) {
      b = placeHireling(
        b,
        i + 1,
        createHirelingInstance(buffed, `buffed-${i}`, "love")
      );
    }
    const rows = buildPricingPanel(ACTIVE, b, defaultPriceMap(ACTIVE));
    const love = rows.find((r) => r.potionType === "love")!;
    expect(love.combinedPotency).toBeGreaterThanOrEqual(CAP_POTENCY);
    expect(love.currentMax).toBe(MAX_PRICE);
    expect(love.status).toEqual({ kind: "at-cap" });
  });

  test("effectivePrice clamps stored price to currentMax", () => {
    let b = createBoard();
    b = placeAt(b, 2, "Sugar Sprinkler", "love"); // potency 5 → max 1g
    let map = defaultPriceMap(ACTIVE);
    // Player set 5g earlier when potency was higher; now clamped.
    map = { prices: new Map(map.prices).set("love", 5) };

    const rows = buildPricingPanel(ACTIVE, b, map);
    const love = rows.find((r) => r.potionType === "love")!;
    expect(love.storedPrice).toBe(5);
    expect(love.currentMax).toBe(1);
    expect(love.effectivePrice).toBe(1);
  });
});

describe("applyHaggle", () => {
  test("adds +3g when the hireling carries Haggle", () => {
    const card = ALL_HIRELINGS.find((h) => h.name === "Almost-A-Knight")!;
    const inst = createHirelingInstance(card, "h", "love");
    expect(card.keywords.some((k) => k.name === "Haggle")).toBe(true);
    expect(applyHaggle(2, inst)).toBe(5);
  });

  test("returns the price unchanged when no Haggle keyword", () => {
    const card = ALL_HIRELINGS.find((h) => h.name === "Doughboy")!;
    const inst = createHirelingInstance(card, "h", "love");
    expect(applyHaggle(2, inst)).toBe(2);
  });
});
