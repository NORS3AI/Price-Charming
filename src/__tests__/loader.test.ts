import { loadCards } from "../cards/loader";
import { HirelingCard, SpellCard } from "../cards/types";

const cards = loadCards();
const hirelings = cards.filter(
  (c): c is HirelingCard => c.kind === "hireling"
);
const spells = cards.filter((c): c is SpellCard => c.kind === "spell");

function findHireling(name: string): HirelingCard {
  const h = hirelings.find((x) => x.name === name);
  if (!h) throw new Error(`Hireling not found: ${name}`);
  return h;
}

function findSpell(name: string): SpellCard {
  const s = spells.find((x) => x.name === name);
  if (!s) throw new Error(`Spell not found: ${name}`);
  return s;
}

describe("loadCards()", () => {
  test("loads all 72 cards from cards.csv", () => {
    expect(cards.length).toBe(72);
  });

  test("guild distribution matches the CSV", () => {
    const counts: Record<string, number> = {};
    for (const h of hirelings) {
      counts[h.guild] = (counts[h.guild] ?? 0) + 1;
    }
    expect(counts).toEqual({
      "Sugar Guild": 20,
      "Thieves Guild": 19,
      "Nobles Guild": 17,
      "No Guild": 7,
    });
    expect(spells.length).toBe(9);
  });

  test("every card id is unique kebab-case", () => {
    const ids = cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });
});

describe("hireling parsing", () => {
  test("parses Doughboy correctly (Quickcraft x2, blank stock → 0)", () => {
    const c = findHireling("Doughboy");
    expect(c.guild).toBe("Sugar Guild");
    expect(c.wageTier).toBe("Low");
    expect(c.roundAvailable).toBe(1);
    expect(c.poolCount).toBe(4);
    expect(c.starRating).toBe(0);
    expect(c.potions).toEqual([{ stock: 0, potency: 4 }]);
    expect(c.castTime).toEqual({ kind: "seconds", value: 5 });
    expect(c.keywords).toEqual([{ name: "Quickcraft", count: 2 }]);
    expect(c.abilityText).toBe("Quickcraft x2.");
  });

  test("parses Pantry Stocker (Passive cast time, no keywords)", () => {
    const c = findHireling("Pantry Stocker");
    expect(c.castTime).toEqual({ kind: "passive" });
    expect(c.keywords).toEqual([]);
    expect(c.potions).toEqual([{ stock: 2, potency: 3 }]);
  });

  test("parses Royal Advisor (random cast time, Sabotage)", () => {
    const c = findHireling("Royal Advisor");
    expect(c.castTime).toEqual({ kind: "random", min: 1, max: 8 });
    expect(c.keywords).toEqual([{ name: "Sabotage" }]);
  });

  test("parses The Grand Vizier (decreasing cast time)", () => {
    const c = findHireling("The Grand Vizier");
    expect(c.castTime).toEqual({
      kind: "decreasing",
      start: 7,
      decrementPerCast: 1,
    });
  });

  test("parses Puss in Boots (two-star, multi-keyword)", () => {
    const c = findHireling("Puss in Boots");
    expect(c.starRating).toBe(2);
    expect(c.keywords).toEqual([
      { name: "Knockoff", count: 5 },
      { name: "Haggle" },
    ]);
    expect(c.potions).toEqual([
      { stock: 7, potency: 7 },
      { stock: 8, potency: 6 },
    ]);
  });

  test("parses The Highwayman (three keywords separated by slashes)", () => {
    const c = findHireling("The Highwayman");
    expect(c.keywords).toEqual([
      { name: "Knockoff", count: 3 },
      { name: "Sabotage" },
      { name: "Bewitch" },
    ]);
  });

  test("parses Dusty Broom (None wage, single potion, kebab id)", () => {
    const c = findHireling("Dusty Broom");
    expect(c.guild).toBe("No Guild");
    expect(c.wageTier).toBe("None");
    expect(c.id).toBe("dusty-broom");
    expect(c.potions).toEqual([{ stock: 5, potency: 1 }]);
    expect(c.keywords).toEqual([]);
  });

  test("Lady's Maid id strips the apostrophe", () => {
    const c = findHireling("Lady's Maid");
    expect(c.id).toBe("ladys-maid");
  });
});

describe("spell parsing", () => {
  test("non-pool Charm spells have null roundAvailable and poolCount", () => {
    const charm = findSpell("Tip Jar Charm");
    expect(charm.roundAvailable).toBeNull();
    expect(charm.poolCount).toBeNull();
    expect(charm.keywords).toEqual([{ name: "Charm" }]);
  });

  test("Spring Cleaning (Upgraded) parses identifier with parentheses", () => {
    const s = findSpell("Spring Cleaning (Upgraded)");
    expect(s.id).toBe("spring-cleaning-upgraded");
    expect(s.poolCount).toBe(3);
    expect(s.roundAvailable).toBe(6);
  });

  test("general spells have empty keywords (None) and ability text", () => {
    const s = findSpell("Bottomless Bottle");
    expect(s.keywords).toEqual([]);
    expect(s.abilityText).toMatch(/permanent stock/);
  });
});
