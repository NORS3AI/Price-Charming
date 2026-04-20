import * as fs from "fs";
import * as path from "path";
import { parseCsv } from "./csv-parser";
import {
  Card,
  CastTime,
  Guild,
  HirelingCard,
  HirelingGuild,
  Keyword,
  KeywordName,
  PotionSlot,
  SpellCard,
  StarRating,
  WageTier,
} from "./types";

const HIRELING_GUILDS: ReadonlySet<HirelingGuild> = new Set([
  "Sugar Guild",
  "Thieves Guild",
  "Nobles Guild",
  "No Guild",
]);

const ALL_GUILDS: ReadonlySet<Guild> = new Set([
  ...HIRELING_GUILDS,
  "Spell",
] as Guild[]);

const WAGE_TIERS: ReadonlySet<WageTier> = new Set([
  "Low",
  "Medium",
  "High",
  "None",
]);

const KEYWORD_NAMES: ReadonlySet<KeywordName> = new Set([
  "Sabotage",
  "Bewitch",
  "Knockoff",
  "Haggle",
  "Quickcraft",
  "Charm",
]);

/** Default location of the master CSV, relative to the repo root. */
export const DEFAULT_CARDS_CSV_PATH = path.resolve(
  __dirname,
  "..",
  "data",
  "cards.csv"
);

/** Parse the cards CSV text into typed Card objects. */
export function parseCards(csv: string): Card[] {
  const { rows } = parseCsv(csv);
  return rows.map((row, index) => parseRow(row, index + 2));
}

/** Read and parse the cards CSV at `filepath` (defaults to the repo CSV). */
export function loadCards(filepath: string = DEFAULT_CARDS_CSV_PATH): Card[] {
  const csv = fs.readFileSync(filepath, "utf8");
  return parseCards(csv);
}

function parseRow(row: Record<string, string>, lineNumber: number): Card {
  const guild = row["Guild"] as Guild;
  if (!ALL_GUILDS.has(guild)) {
    throw new Error(`Line ${lineNumber}: unknown Guild "${row["Guild"]}".`);
  }

  return guild === "Spell"
    ? parseSpell(row, lineNumber)
    : parseHireling(row, guild, lineNumber);
}

function parseHireling(
  row: Record<string, string>,
  guild: HirelingGuild,
  lineNumber: number
): HirelingCard {
  const name = required(row, "Name", lineNumber);
  const wageTier = parseWageTier(row["Wage Tier"], lineNumber);
  const roundAvailable = parseRequiredInt(
    row["Round Available"],
    "Round Available",
    lineNumber
  );
  const poolCount = parseRequiredInt(
    row["Pool Count"],
    "Pool Count",
    lineNumber
  );

  return {
    kind: "hireling",
    id: kebab(name),
    name,
    starRating: parseStarRating(row["Star Rating"]),
    guild,
    wageTier,
    roundAvailable,
    poolCount,
    potions: parsePotions(row, lineNumber),
    castTime: parseCastTime(row["Cast Time"], lineNumber),
    keywords: parseKeywords(row["Keywords"], lineNumber),
    abilityText: row["Ability Text"] ?? "",
  };
}

function parseSpell(
  row: Record<string, string>,
  lineNumber: number
): SpellCard {
  const name = required(row, "Name", lineNumber);
  return {
    kind: "spell",
    id: kebab(name),
    name,
    starRating: parseStarRating(row["Star Rating"]),
    roundAvailable: parseOptionalInt(row["Round Available"]),
    poolCount: parseOptionalInt(row["Pool Count"]),
    keywords: parseKeywords(row["Keywords"], lineNumber),
    abilityText: row["Ability Text"] ?? "",
  };
}

function required(
  row: Record<string, string>,
  column: string,
  lineNumber: number
): string {
  const value = row[column];
  if (!value) {
    throw new Error(`Line ${lineNumber}: missing required column "${column}".`);
  }
  return value;
}

function parseWageTier(raw: string | undefined, lineNumber: number): WageTier {
  const value = (raw ?? "").trim();
  if (!WAGE_TIERS.has(value as WageTier)) {
    throw new Error(`Line ${lineNumber}: unknown Wage Tier "${raw}".`);
  }
  return value as WageTier;
}

function parseStarRating(raw: string | undefined): StarRating {
  const value = (raw ?? "").trim();
  if (value === "" ) return 0;
  if (value === "⭐") return 1;
  if (value === "⭐⭐") return 2;
  // Be lenient: count star characters in case of whitespace or copy-paste drift.
  const stars = (value.match(/⭐/g) ?? []).length;
  if (stars === 1) return 1;
  if (stars === 2) return 2;
  return 0;
}

function parseRequiredInt(
  raw: string | undefined,
  column: string,
  lineNumber: number
): number {
  const value = (raw ?? "").trim();
  const n = Number(value);
  if (!Number.isInteger(n)) {
    throw new Error(
      `Line ${lineNumber}: "${column}" must be an integer (got "${raw}").`
    );
  }
  return n;
}

function parseOptionalInt(raw: string | undefined): number | null {
  const value = (raw ?? "").trim();
  if (value === "" || value.toUpperCase() === "N/A") return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function parsePotions(
  row: Record<string, string>,
  lineNumber: number
): PotionSlot[] {
  const slot1 = parsePotion(
    row["Potion 1 Stock"],
    row["Potion 1 Potency"],
    lineNumber,
    "Potion 1"
  );
  const slot2 = parsePotion(
    row["Potion 2 Stock"],
    row["Potion 2 Potency"],
    lineNumber,
    "Potion 2"
  );
  const potions: PotionSlot[] = [];
  if (slot1) potions.push(slot1);
  if (slot2) potions.push(slot2);
  if (potions.length === 0) {
    throw new Error(`Line ${lineNumber}: hireling has no potion potency set.`);
  }
  return potions;
}

function parsePotion(
  rawStock: string | undefined,
  rawPotency: string | undefined,
  lineNumber: number,
  label: string
): PotionSlot | null {
  const stockStr = (rawStock ?? "").trim();
  const potencyStr = (rawPotency ?? "").trim();
  if (potencyStr === "" || potencyStr.toUpperCase() === "N/A") {
    return null;
  }
  const potency = Number(potencyStr);
  if (!Number.isInteger(potency)) {
    throw new Error(
      `Line ${lineNumber}: ${label} potency must be an integer (got "${rawPotency}").`
    );
  }
  // Quickcraft hirelings leave stock blank — treat blank as 0.
  const stock = stockStr === "" ? 0 : Number(stockStr);
  if (!Number.isInteger(stock)) {
    throw new Error(
      `Line ${lineNumber}: ${label} stock must be an integer or blank (got "${rawStock}").`
    );
  }
  return { stock, potency };
}

function parseCastTime(raw: string | undefined, lineNumber: number): CastTime {
  const value = (raw ?? "").trim();
  if (value === "" || value.toUpperCase() === "N/A") return { kind: "none" };
  if (/^passive$/i.test(value)) return { kind: "passive" };

  const range = value.match(/^(\d+)\s*-\s*(\d+)\s*s\s*\(random\)\s*$/i);
  if (range) {
    return {
      kind: "random",
      min: Number(range[1]),
      max: Number(range[2]),
    };
  }

  const decreasing = value.match(
    /^(\d+)\s*s\s*\(reduces by (\d+)\s*s per cast\)\s*$/i
  );
  if (decreasing) {
    return {
      kind: "decreasing",
      start: Number(decreasing[1]),
      decrementPerCast: Number(decreasing[2]),
    };
  }

  const fixed = value.match(/^(\d+(?:\.\d+)?)\s*s$/i);
  if (fixed) return { kind: "seconds", value: Number(fixed[1]) };

  throw new Error(`Line ${lineNumber}: unrecognised Cast Time "${raw}".`);
}

function parseKeywords(raw: string | undefined, lineNumber: number): Keyword[] {
  const value = (raw ?? "").trim();
  if (value === "" || /^none$/i.test(value)) return [];

  return value.split(/\s*\/\s*/).map((token) => parseKeyword(token, lineNumber));
}

function parseKeyword(token: string, lineNumber: number): Keyword {
  const match = token.match(/^([A-Za-z]+)(?:\s*x(\d+))?$/);
  if (!match) {
    throw new Error(`Line ${lineNumber}: unrecognised keyword "${token}".`);
  }
  const name = match[1] as KeywordName;
  const countStr = match[2];

  if (!KEYWORD_NAMES.has(name)) {
    throw new Error(`Line ${lineNumber}: unknown keyword "${name}".`);
  }

  if (countStr !== undefined) {
    // Per the design spec only Knockoff, Haggle, and Quickcraft are meant to
    // accept an `xN` count, but the master CSV occasionally uses counts on
    // other keywords (e.g. The Saboteur's "Sabotage x2"). Preserve those
    // values rather than dropping data — design enforcement can happen later.
    return { name, count: Number(countStr) };
  }
  return { name };
}

function kebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
