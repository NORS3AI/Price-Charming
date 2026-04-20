import { ALL_HIRELINGS } from "../cards/hirelings";
import { ALL_SPELLS } from "../cards/spells";
import { parseCards } from "../cards/loader";
import { EXPORT_COLUMNS } from "../export/columns";
import {
  allExportRows,
  cardToExportRow,
  escapeCsvField,
  exportAllCardsAsCsv,
  formatCastTime,
  formatKeywords,
  toCsv,
} from "../export/rows";
import {
  DEFAULT_EXPORT_FILENAME,
  downloadCardsExport,
} from "../export/download";

describe("formatKeywords", () => {
  test('joins keywords with " / " and appends xN counts', () => {
    expect(
      formatKeywords(
        [
          { name: "Knockoff", count: 3 },
          { name: "Sabotage" },
          { name: "Bewitch" },
        ],
        ""
      )
    ).toBe("Knockoff x3 / Sabotage / Bewitch");
  });

  test('renders empty as "" for hirelings, "None" for spells', () => {
    expect(formatKeywords([], "")).toBe("");
    expect(formatKeywords([], "None")).toBe("None");
  });
});

describe("formatCastTime", () => {
  test("round-trips each CastTime variant", () => {
    expect(formatCastTime({ kind: "seconds", value: 5 })).toBe("5s");
    expect(formatCastTime({ kind: "passive" })).toBe("Passive");
    expect(formatCastTime({ kind: "random", min: 1, max: 8 })).toBe(
      "1-8s (random)"
    );
    expect(
      formatCastTime({
        kind: "decreasing",
        start: 7,
        decrementPerCast: 1,
      })
    ).toBe("7s (reduces by 1s per cast)");
  });
});

describe("escapeCsvField", () => {
  test("passes plain text through unchanged", () => {
    expect(escapeCsvField("Doughboy")).toBe("Doughboy");
  });

  test('wraps fields with commas or quotes in double quotes and doubles internal quotes', () => {
    expect(escapeCsvField("hello, world")).toBe('"hello, world"');
    expect(escapeCsvField('she said "hi"')).toBe('"she said ""hi"""');
  });

  test("wraps fields containing newlines", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("cardToExportRow", () => {
  test("hireling: blank Quickcraft stock, keywords joined, cast time rendered", () => {
    const doughboy = ALL_HIRELINGS.find((h) => h.name === "Doughboy")!;
    const row = cardToExportRow(doughboy);
    expect(row.Guild).toBe("Sugar Guild");
    expect(row.Name).toBe("Doughboy");
    expect(row["Wage Tier"]).toBe("Low");
    expect(row["Round Available"]).toBe("1");
    expect(row["Pool Count"]).toBe("4");
    expect(row["Potion 1 Stock"]).toBe(""); // Quickcraft → 0 → blank in CSV
    expect(row["Potion 1 Potency"]).toBe("4");
    expect(row["Potion 2 Stock"]).toBe("");
    expect(row["Potion 2 Potency"]).toBe("");
    expect(row["Cast Time"]).toBe("5s");
    expect(row.Keywords).toBe("Quickcraft x2");
  });

  test("hireling: star rating emojis", () => {
    const oneStar = ALL_HIRELINGS.find((h) => h.name === "Oven Master")!;
    const twoStar = ALL_HIRELINGS.find((h) => h.name === "Puss in Boots")!;
    expect(cardToExportRow(oneStar)["Star Rating"]).toBe("⭐");
    expect(cardToExportRow(twoStar)["Star Rating"]).toBe("⭐⭐");
  });

  test("spell: Wage / Round / Pool / Potion columns fill N/A where the CSV expects it", () => {
    const polish = ALL_SPELLS.find((s) => s.name === "Potion Polish")!;
    const row = cardToExportRow(polish);
    expect(row.Guild).toBe("Spell");
    expect(row["Wage Tier"]).toBe("N/A");
    expect(row["Round Available"]).toBe("N/A");
    expect(row["Pool Count"]).toBe("3");
    expect(row["Potion 1 Stock"]).toBe("N/A");
    expect(row["Potion 1 Potency"]).toBe("N/A");
    expect(row["Cast Time"]).toBe("N/A");
    expect(row.Keywords).toBe("None");
  });

  test("spell: Charm keyword preserved, pool/round N/A", () => {
    const tipJar = ALL_SPELLS.find((s) => s.id === "tip-jar-charm")!;
    const row = cardToExportRow(tipJar);
    expect(row["Pool Count"]).toBe("N/A");
    expect(row.Keywords).toBe("Charm");
  });
});

describe("toCsv + exportAllCardsAsCsv", () => {
  test("first line is the header in canonical order", () => {
    const csv = toCsv([]);
    expect(csv.split("\n")[0]).toBe(EXPORT_COLUMNS.join(","));
  });

  test("writes one row per hireling + spell", () => {
    const csv = exportAllCardsAsCsv();
    const lines = csv.trim().split("\n");
    expect(lines.length).toBe(1 + ALL_HIRELINGS.length + ALL_SPELLS.length);
  });

  test("fields containing commas get quoted", () => {
    // Almost-A-Knight: Haggle + quoted ability text with commas.
    const csv = exportAllCardsAsCsv();
    expect(csv).toContain('"Haggle. If Haggled sale succeeds, gain +2 temporary stock."');
  });

  test("round-trips through the loader: parseCards(export) produces matching data", () => {
    const csv = exportAllCardsAsCsv();
    const reparsed = parseCards(csv);
    expect(reparsed.length).toBe(ALL_HIRELINGS.length + ALL_SPELLS.length);

    // Spot-check a few tricky cards.
    const doughboy = reparsed.find((c) => c.name === "Doughboy")!;
    expect(doughboy.kind).toBe("hireling");
    if (doughboy.kind === "hireling") {
      expect(doughboy.keywords).toEqual([{ name: "Quickcraft", count: 2 }]);
      expect(doughboy.castTime).toEqual({ kind: "seconds", value: 5 });
    }

    const vizier = reparsed.find((c) => c.name === "The Grand Vizier")!;
    if (vizier.kind === "hireling") {
      expect(vizier.castTime).toEqual({
        kind: "decreasing",
        start: 7,
        decrementPerCast: 1,
      });
    }

    const royalAdvisor = reparsed.find((c) => c.name === "Royal Advisor")!;
    if (royalAdvisor.kind === "hireling") {
      expect(royalAdvisor.castTime).toEqual({
        kind: "random",
        min: 1,
        max: 8,
      });
    }

    const polish = reparsed.find((c) => c.name === "Potion Polish")!;
    expect(polish.kind).toBe("spell");
    if (polish.kind === "spell") {
      expect(polish.keywords).toEqual([]);
      expect(polish.poolCount).toBe(3);
      expect(polish.roundAvailable).toBeNull();
    }

    const tipJar = reparsed.find((c) => c.name === "Tip Jar Charm")!;
    if (tipJar.kind === "spell") {
      expect(tipJar.keywords).toEqual([{ name: "Charm" }]);
      expect(tipJar.poolCount).toBeNull();
      expect(tipJar.roundAvailable).toBeNull();
    }
  });
});

describe("allExportRows", () => {
  test("ordered hirelings first, then spells", () => {
    const rows = allExportRows();
    const firstSpellIdx = rows.findIndex((r) => r.Guild === "Spell");
    for (let i = 0; i < firstSpellIdx; i++) {
      expect(rows[i].Guild).not.toBe("Spell");
    }
    for (let i = firstSpellIdx; i < rows.length; i++) {
      expect(rows[i].Guild).toBe("Spell");
    }
  });
});

describe("downloadCardsExport", () => {
  test("returns the CSV string even in Node (no DOM)", () => {
    const csv = downloadCardsExport();
    expect(csv.startsWith("Guild,")).toBe(true);
    expect(csv.trim().split("\n").length).toBe(
      1 + ALL_HIRELINGS.length + ALL_SPELLS.length
    );
  });

  test("default filename matches the spec", () => {
    expect(DEFAULT_EXPORT_FILENAME).toBe("price-charming-cards.csv");
  });

  test("a BOM-prefixed export round-trips through parseCards (regression)", () => {
    // Simulate what a browser download would hand back if re-imported
    // as-is — includes the UTF-8 BOM we prepend for Excel.
    const withBom = "\ufeff" + exportAllCardsAsCsv();
    const reparsed = parseCards(withBom);
    expect(reparsed.length).toBe(ALL_HIRELINGS.length + ALL_SPELLS.length);
    expect(reparsed.find((c) => c.name === "Doughboy")).toBeDefined();
  });
});

describe("EXPORT_COLUMNS", () => {
  test("is frozen at runtime for consistency with other spec constants", () => {
    expect(Object.isFrozen(EXPORT_COLUMNS)).toBe(true);
  });
});
