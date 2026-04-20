/**
 * Column order for the Export-to-Excel admin CSV. Matches the header
 * in `src/data/cards.csv` exactly so an exported file round-trips
 * through the loader.
 */
export const EXPORT_COLUMNS = [
  "Guild",
  "Name",
  "Star Rating",
  "Wage Tier",
  "Round Available",
  "Pool Count",
  "Potion 1 Stock",
  "Potion 1 Potency",
  "Potion 2 Stock",
  "Potion 2 Potency",
  "Cast Time",
  "Keywords",
  "Ability Text",
] as const;

export type ExportColumn = (typeof EXPORT_COLUMNS)[number];
