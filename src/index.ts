// Card types
export type {
  BaseCard,
  Card,
  CastTime,
  Guild,
  HirelingCard,
  HirelingGuild,
  Keyword,
  KeywordName,
  CountedKeywordName,
  PotionSlot,
  SpellCard,
  StarRating,
  WageTier,
} from "./cards/types";

// Keyword definitions
export {
  ALL_KEYWORDS,
  COUNTED_KEYWORDS,
  getKeywordDefinition,
  keywordAcceptsCount,
} from "./cards/keywords";
export type { KeywordDefinition } from "./cards/keywords";

// CSV loading
export { parseCsv } from "./cards/csv-parser";
export type { ParsedCsv } from "./cards/csv-parser";
export {
  loadCards,
  parseCards,
  getAllCards,
  DEFAULT_CARDS_CSV_PATH,
} from "./cards/loader";

// Card registries (loaded from src/data/cards.csv)
export { ALL_HIRELINGS } from "./cards/hirelings";
export { ALL_SPELLS } from "./cards/spells";

// Economy — gold, wages, and payday schedule
export {
  STARTING_GOLD,
  COST_HIRELING,
  COST_SPELL,
  COST_REFRESH,
  SELL_VALUE,
  canAfford,
} from "./economy/gold";
export {
  MAX_PAYDAYS,
  WAGE_SCHEDULE,
  createWageTracker,
  wageFor,
  currentWageDemand,
  survivePayday,
  isExemptFromPayday,
} from "./economy/wages";
export type { WageTracker } from "./economy/wages";
export {
  PAYDAY_ROUNDS,
  GLOW_ROUNDS,
  isPaydayRound,
  isGlowRound,
  paydayIndex,
  nextPaydayRound,
  roundsUntilPayday,
  buildPaydayLineItems,
  totalPaydays,
} from "./economy/payday";
export type { PaydayLineItem } from "./economy/payday";
