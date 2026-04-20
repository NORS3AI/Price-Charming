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
} from "./economy/payday";
export type { PaydayLineItem } from "./economy/payday";

// Board & hand (Phase 3)
export type {
  Board,
  Hand,
  HandCardInstance,
  HirelingInstance,
  SpellInstance,
} from "./board/types";
export {
  MAX_HAND_SIZE,
  createHand,
  createHirelingInstance,
  createSpellInstance,
  handSize,
  isHandFull,
  addToHand,
  removeFromHand,
  isHireling,
  isSpell,
} from "./board/hand";
export {
  BOARD_SIZE,
  BENCH_SLOTS,
  ACTIVE_SLOTS,
  STARTER_SLOT,
  createBoard,
  isBenchSlot,
  isActiveSlot,
  isBoardFull,
  firstEmptySlot,
  activeHirelings,
  benchHirelings,
  allHirelings,
  placeHireling,
  playHirelingFromHand,
  sellHirelingFromBoard,
  sellHirelingFromHand,
  rearrangeBoard,
} from "./board/board";
export {
  createDustyBroomInstance,
  createStarterBoard,
  createStarterState,
} from "./board/starter";

// Potion types (Phase 4A)
export type { PotionTypeId, PotionTypeMeta } from "./potions/types";
export {
  ACTIVE_POTION_COUNT,
  POTION_TYPES,
  getPotionMeta,
} from "./potions/types";
export { selectActivePotionTypes } from "./potions/selection";
export type { PotionDiscovery } from "./potions/discovery";
export {
  createDiscovery,
  discoveredCount,
  isSeen,
  markSeen,
  markSeenMany,
} from "./potions/discovery";
export type { RNG } from "./potions/rng";
export { defaultRng, mulberry32, pick, shuffle } from "./potions/rng";

// Shop pool (Phase 4B)
export type { PoolInstance, ShopPool } from "./shop/pool";
export {
  countOfCard,
  createInitialPool,
  instanceIdFor,
  isHirelingPoolInstance,
  isInPool,
  isSpellPoolInstance,
  poolAvailableAtRound,
  poolHirelings,
  poolSize,
  poolSpells,
  removeFromPoolWhere,
  returnToPool,
  takeFromPool,
} from "./shop/pool";
export {
  assignHirelingPotion,
  assignPotionsToPool,
} from "./shop/assignment";
export type { RollOptions, ShopOffering } from "./shop/offering";
export {
  DEFAULT_SHOP_SIZE,
  DEFAULT_SPELL_CHANCE,
  createEmptyOffering,
  offeringHirelings,
  offeringInstances,
  offeringSpells,
  refreshShop,
  rollShop,
  takeFromOffering,
} from "./shop/offering";
export {
  buyHirelingFromShop,
  buySpellFromShop,
  refreshShopWithCost,
  sellHirelingFromBoardToPool,
  sellHirelingFromHandToPool,
} from "./shop/purchase";
export {
  SPRING_CLEANING_ID,
  SPRING_CLEANING_UPGRADED_ID,
  castSpringCleaning,
  isSpringCleaningId,
} from "./shop/spring-cleaning";

// Pricing (Phase 5)
export type { PriceBracket } from "./pricing/brackets";
export {
  CAP_POTENCY,
  MAX_PRICE,
  MIN_PRICE,
  PRICE_BRACKETS,
  maxPriceForPotency,
  potencyToNextBracket,
} from "./pricing/brackets";
export {
  combinedPotencyForType,
  combinedPotencyFromBoard,
  combinedPotencyMap,
} from "./pricing/potency";
export type { PriceMap, PricingPanelEntry, PricingStatus } from "./pricing/panel";
export {
  applyHaggle,
  buildPricingPanel,
  defaultPriceMap,
  priceFor,
  setPrice,
} from "./pricing/panel";
export type { UnitsRange } from "./pricing/stock";
export { rollUnitsPerInteraction, unitsRange } from "./pricing/stock";

// Customers (Phase 6)
export type {
  AxisBar,
  AxisKind,
  Customer,
  CustomerState,
  Resolution,
  Side,
} from "./customers/types";
export {
  AXES,
  AXIS_THRESHOLD,
  MAX_REPUTATION_STARS,
  MIN_REPUTATION_STARS,
} from "./customers/types";
export {
  applyContribution,
  axesLedBy,
  axisLeader,
  createCustomerState,
  determineWinner,
  isExpired,
  isResolved,
  reputationReward,
  resolveCustomer,
  tickPatience,
} from "./customers/state";
export type { PassiveContribution } from "./customers/contributions";
export {
  PASSIVE_RATES,
  computePassiveContribution,
  contributionToAxes,
  overBudgetPressure,
} from "./customers/contributions";

// Action round (Phase 7)
export type {
  ActionLogEntry,
  ActionState,
  HirelingActionState,
} from "./action/types";
export {
  addCustomer,
  firstCastDelay,
  initializeActionState,
  nextCastDelay,
  setWeather,
  tick,
} from "./action/state";
export type { Weather, WeatherEffect } from "./action/weather";
export { tickWeather } from "./action/weather";
