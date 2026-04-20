import {
  ALL_KEYWORDS,
  COUNTED_KEYWORDS,
  getKeywordDefinition,
  keywordAcceptsCount,
} from "../cards/keywords";
import { KeywordName } from "../cards/types";

const expectedKeywords: KeywordName[] = [
  "Sabotage",
  "Bewitch",
  "Knockoff",
  "Haggle",
  "Quickcraft",
  "Charm",
];

describe("keyword definitions", () => {
  test("define all six keywords", () => {
    expect(ALL_KEYWORDS.map((k) => k.name)).toEqual(expectedKeywords);
  });

  test("each keyword has both coding and player text", () => {
    for (const kw of ALL_KEYWORDS) {
      expect(kw.coding.length).toBeGreaterThan(0);
      expect(kw.player.length).toBeGreaterThan(0);
    }
  });

  test("only Knockoff, Haggle, and Quickcraft accept an xN count", () => {
    expect([...COUNTED_KEYWORDS].sort()).toEqual(
      ["Haggle", "Knockoff", "Quickcraft"].sort()
    );

    expect(keywordAcceptsCount("Knockoff")).toBe(true);
    expect(keywordAcceptsCount("Haggle")).toBe(true);
    expect(keywordAcceptsCount("Quickcraft")).toBe(true);

    expect(keywordAcceptsCount("Sabotage")).toBe(false);
    expect(keywordAcceptsCount("Bewitch")).toBe(false);
    expect(keywordAcceptsCount("Charm")).toBe(false);
  });

  test("getKeywordDefinition returns the right definition", () => {
    const sabotage = getKeywordDefinition("Sabotage");
    expect(sabotage?.player).toMatch(/cast time by 1s/);
    const quickcraft = getKeywordDefinition("Quickcraft");
    expect(quickcraft?.coding).toMatch(/base stock is always 0/i);
  });
});
