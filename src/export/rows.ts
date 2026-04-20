import { ALL_HIRELINGS } from "../cards/hirelings";
import { ALL_SPELLS } from "../cards/spells";
import {
  Card,
  CastTime,
  HirelingCard,
  Keyword,
  PotionSlot,
  SpellCard,
  StarRating,
} from "../cards/types";
import { EXPORT_COLUMNS, ExportColumn } from "./columns";

/** Render a StarRating to the CSV's glyph convention. */
function formatStarRating(rating: StarRating): string {
  if (rating === 1) return "⭐";
  if (rating === 2) return "⭐⭐";
  return "";
}

/** Render a CastTime back to the CSV's free-form string format. */
export function formatCastTime(castTime: CastTime): string {
  switch (castTime.kind) {
    case "seconds":
      return `${castTime.value}s`;
    case "passive":
      return "Passive";
    case "random":
      return `${castTime.min}-${castTime.max}s (random)`;
    case "decreasing":
      return `${castTime.start}s (reduces by ${castTime.decrementPerCast}s per cast)`;
  }
}

/** Render a keyword list to the "A xN / B / C" CSV form, or "" / "None". */
export function formatKeywords(
  keywords: readonly Keyword[],
  fallback: "" | "None"
): string {
  if (keywords.length === 0) return fallback;
  return keywords
    .map((k) => (k.count !== undefined ? `${k.name} x${k.count}` : k.name))
    .join(" / ");
}

/** Stock fields in the CSV are blank when the card has no printed stock. */
function formatStock(slot: PotionSlot | undefined): string {
  if (!slot) return "";
  // The CSV represents Quickcraft hirelings as blank-stock cells, even
  // though the loader stores them as 0.
  return slot.stock === 0 ? "" : String(slot.stock);
}

function formatPotency(slot: PotionSlot | undefined): string {
  return slot ? String(slot.potency) : "";
}

function hirelingRow(card: HirelingCard): Record<ExportColumn, string> {
  const [p1, p2] = card.potions;
  return {
    Guild: card.guild,
    Name: card.name,
    "Star Rating": formatStarRating(card.starRating),
    "Wage Tier": card.wageTier,
    "Round Available": String(card.roundAvailable),
    "Pool Count": String(card.poolCount),
    "Potion 1 Stock": formatStock(p1),
    "Potion 1 Potency": formatPotency(p1),
    "Potion 2 Stock": formatStock(p2),
    "Potion 2 Potency": formatPotency(p2),
    "Cast Time": formatCastTime(card.castTime),
    Keywords: formatKeywords(card.keywords, ""),
    "Ability Text": card.abilityText,
  };
}

function spellRow(card: SpellCard): Record<ExportColumn, string> {
  return {
    Guild: "Spell",
    Name: card.name,
    "Star Rating": formatStarRating(card.starRating),
    "Wage Tier": "N/A",
    "Round Available":
      card.roundAvailable === null ? "N/A" : String(card.roundAvailable),
    "Pool Count":
      card.poolCount === null ? "N/A" : String(card.poolCount),
    "Potion 1 Stock": "N/A",
    "Potion 1 Potency": "N/A",
    "Potion 2 Stock": "N/A",
    "Potion 2 Potency": "N/A",
    "Cast Time": "N/A",
    Keywords: formatKeywords(card.keywords, "None"),
    "Ability Text": card.abilityText,
  };
}

/** Serialize a single card to its column-keyed row. */
export function cardToExportRow(card: Card): Record<ExportColumn, string> {
  return card.kind === "hireling" ? hirelingRow(card) : spellRow(card);
}

/**
 * All cards (hirelings then spells), in the same order as ALL_HIRELINGS
 * + ALL_SPELLS — which in turn follows the CSV file.
 */
export function allExportRows(): Record<ExportColumn, string>[] {
  const rows: Record<ExportColumn, string>[] = [];
  for (const card of ALL_HIRELINGS) rows.push(cardToExportRow(card));
  for (const card of ALL_SPELLS) rows.push(cardToExportRow(card));
  return rows;
}

/** Escape a single CSV field per RFC-4180 rules. */
export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize rows + header to an RFC-4180 CSV string (LF line endings). */
export function toCsv(rows: Record<ExportColumn, string>[]): string {
  const lines: string[] = [];
  lines.push(EXPORT_COLUMNS.map(escapeCsvField).join(","));
  for (const row of rows) {
    lines.push(EXPORT_COLUMNS.map((col) => escapeCsvField(row[col])).join(","));
  }
  return lines.join("\n") + "\n";
}

/** One-call export: every hireling + spell serialized to a CSV string. */
export function exportAllCardsAsCsv(): string {
  return toCsv(allExportRows());
}
