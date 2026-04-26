"use strict";
var PriceCharming = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    ACTIVE_POTION_COUNT: () => ACTIVE_POTION_COUNT,
    ACTIVE_SLOTS: () => ACTIVE_SLOTS,
    ALL_HIRELINGS: () => ALL_HIRELINGS,
    ALL_KEYWORDS: () => ALL_KEYWORDS,
    ALL_SPELLS: () => ALL_SPELLS,
    AXES: () => AXES,
    AXIS_PRIORITY_WEIGHTS: () => AXIS_PRIORITY_WEIGHTS,
    AXIS_THRESHOLD: () => AXIS_THRESHOLD,
    BENCH_SLOTS: () => BENCH_SLOTS,
    BEWITCH_FOCUS_BURST: () => BEWITCH_FOCUS_BURST,
    BOARD_SIZE: () => BOARD_SIZE,
    CAP_POTENCY: () => CAP_POTENCY,
    CHARM_MERGE_COUNT: () => CHARM_MERGE_COUNT,
    CHARM_SPELL_CARDS: () => CHARM_SPELL_CARDS,
    CHARM_SPELL_IDS: () => CHARM_SPELL_IDS,
    COST_HIRELING: () => COST_HIRELING,
    COST_REFRESH: () => COST_REFRESH,
    COST_SPELL: () => COST_SPELL,
    COUNTED_KEYWORDS: () => COUNTED_KEYWORDS,
    DEFAULT_CARDS_CSV_PATH: () => DEFAULT_CARDS_CSV_PATH,
    DEFAULT_EXPORT_FILENAME: () => DEFAULT_EXPORT_FILENAME,
    DEFAULT_SHOP_SIZE: () => DEFAULT_SHOP_SIZE,
    DEFAULT_SPELL_CHANCE: () => DEFAULT_SPELL_CHANCE,
    EARLY_RESOLVE_MIN_DIFF: () => EARLY_RESOLVE_MIN_DIFF,
    EXPORT_COLUMNS: () => EXPORT_COLUMNS,
    FIRST_ROUND: () => FIRST_ROUND,
    GLOW_ROUNDS: () => GLOW_ROUNDS,
    LUCKY_POTENCY_BONUS: () => LUCKY_POTENCY_BONUS,
    MAX_BEWITCH_LEVEL: () => MAX_BEWITCH_LEVEL,
    MAX_HAND_SIZE: () => MAX_HAND_SIZE,
    MAX_PAYDAYS: () => MAX_PAYDAYS,
    MAX_PRICE: () => MAX_PRICE,
    MAX_REPUTATION_STARS: () => MAX_REPUTATION_STARS,
    MAX_ROUNDS: () => MAX_ROUNDS,
    MIN_PRICE: () => MIN_PRICE,
    MIN_REPUTATION_STARS: () => MIN_REPUTATION_STARS,
    PASSIVE_RATES: () => PASSIVE_RATES,
    PAYDAY_ROUNDS: () => PAYDAY_ROUNDS,
    POTION_TYPES: () => POTION_TYPES,
    PRICE_BRACKETS: () => PRICE_BRACKETS,
    REPUTATION_MAX: () => REPUTATION_MAX,
    REPUTATION_MIN: () => REPUTATION_MIN,
    SABOTAGE_DEFAULT_SECONDS: () => SABOTAGE_DEFAULT_SECONDS,
    SELL_VALUE: () => SELL_VALUE,
    SPRING_CLEANING_ID: () => SPRING_CLEANING_ID,
    SPRING_CLEANING_UPGRADED_ID: () => SPRING_CLEANING_UPGRADED_ID,
    STARTER_SLOT: () => STARTER_SLOT,
    STARTING_GOLD: () => STARTING_GOLD,
    TIP_JAR_GOLD: () => TIP_JAR_GOLD,
    WAGE_SCHEDULE: () => WAGE_SCHEDULE,
    activeHirelings: () => activeHirelings,
    addActionCustomer: () => addActionCustomer,
    addCustomer: () => addCustomer,
    addToHand: () => addToHand,
    allExportRows: () => allExportRows,
    allHirelings: () => allHirelings,
    applyContribution: () => applyContribution,
    applyEndOfRoundHooks: () => applyEndOfRoundHooks,
    applyHaggle: () => applyHaggle,
    assignHirelingPotion: () => assignHirelingPotion,
    assignPotionsToPool: () => assignPotionsToPool,
    axesLedBy: () => axesLedBy,
    axisLeader: () => axisLeader,
    benchHirelings: () => benchHirelings,
    buildCharmedInstance: () => buildCharmedInstance,
    buildPaydayLineItems: () => buildPaydayLineItems,
    buildPricingPanel: () => buildPricingPanel,
    buyHirelingFromShop: () => buyHirelingFromShop,
    buySpellFromShop: () => buySpellFromShop,
    canAfford: () => canAfford,
    captureSnapshot: () => captureSnapshot,
    cardToExportRow: () => cardToExportRow,
    castLuckyCharm: () => castLuckyCharm,
    castSecondChanceCharm: () => castSecondChanceCharm,
    castSpringCleaning: () => castSpringCleaning,
    castTipJarCharm: () => castTipJarCharm,
    clampReputation: () => clampReputation,
    combinedPotencyForType: () => combinedPotencyForType,
    combinedPotencyFromBoard: () => combinedPotencyFromBoard,
    combinedPotencyMap: () => combinedPotencyMap,
    computePassiveContribution: () => computePassiveContribution,
    contributionToAxes: () => contributionToAxes,
    countOfCard: () => countOfCard,
    createBoard: () => createBoard,
    createCustomerState: () => createCustomerState,
    createDiscovery: () => createDiscovery,
    createDustyBroomInstance: () => createDustyBroomInstance,
    createEmptyOffering: () => createEmptyOffering,
    createGame: () => createGame,
    createHand: () => createHand,
    createHirelingInstance: () => createHirelingInstance,
    createInitialPool: () => createInitialPool,
    createSpellInstance: () => createSpellInstance,
    createStarterBoard: () => createStarterBoard,
    createStarterState: () => createStarterState,
    createWageTracker: () => createWageTracker,
    currentWageDemand: () => currentWageDemand,
    defaultPriceMap: () => defaultPriceMap,
    defaultRng: () => defaultRng,
    determineEarlyWinner: () => determineEarlyWinner,
    determineWinner: () => determineWinner,
    discoveredCount: () => discoveredCount,
    downloadCardsExport: () => downloadCardsExport,
    endRound: () => endRound,
    endShopPhase: () => endShopPhase,
    escapeCsvField: () => escapeCsvField,
    exportAllCardsAsCsv: () => exportAllCardsAsCsv,
    finalizeRound: () => finalizeRound,
    findCharmableTriple: () => findCharmableTriple,
    firstCastDelay: () => firstCastDelay,
    firstEmptySlot: () => firstEmptySlot,
    formatCastTime: () => formatCastTime,
    formatKeywords: () => formatKeywords,
    getAllCards: () => getAllCards,
    getKeywordDefinition: () => getKeywordDefinition,
    getPotionMeta: () => getPotionMeta,
    handSize: () => handSize,
    initializeActionState: () => initializeActionState,
    instanceIdFor: () => instanceIdFor,
    isActiveSlot: () => isActiveSlot,
    isBenchSlot: () => isBenchSlot,
    isBoardFull: () => isBoardFull,
    isExemptFromPayday: () => isExemptFromPayday,
    isExpired: () => isExpired,
    isGlowRound: () => isGlowRound,
    isHandFull: () => isHandFull,
    isHireling: () => isHireling,
    isHirelingPoolInstance: () => isHirelingPoolInstance,
    isInPool: () => isInPool,
    isPaydayRound: () => isPaydayRound,
    isResolved: () => isResolved,
    isSeen: () => isSeen,
    isSpell: () => isSpell,
    isSpellPoolInstance: () => isSpellPoolInstance,
    isSpringCleaningId: () => isSpringCleaningId,
    keywordAcceptsCount: () => keywordAcceptsCount,
    loadCards: () => loadCards,
    markSeen: () => markSeen,
    markSeenMany: () => markSeenMany,
    maxPriceForPotency: () => maxPriceForPotency,
    mergeCharmableTriple: () => mergeCharmableTriple,
    mergeIfCharmable: () => mergeIfCharmable,
    mulberry32: () => mulberry32,
    nextCastDelay: () => nextCastDelay,
    nextPaydayRound: () => nextPaydayRound,
    offeringHirelings: () => offeringHirelings,
    offeringInstances: () => offeringInstances,
    offeringSpells: () => offeringSpells,
    overBudgetPressure: () => overBudgetPressure,
    parseCards: () => parseCards,
    parseCsv: () => parseCsv,
    payWage: () => payWage,
    paydayDueNow: () => paydayDueNow,
    paydayIndex: () => paydayIndex,
    paydayLineItems: () => paydayLineItems,
    pick: () => pick,
    pickRandomCharm: () => pickRandomCharm,
    placeHireling: () => placeHireling,
    playCharmed: () => playCharmed,
    playHirelingFromHand: () => playHirelingFromHand,
    poolAvailableAtRound: () => poolAvailableAtRound,
    poolHirelings: () => poolHirelings,
    poolSize: () => poolSize,
    poolSpells: () => poolSpells,
    potencyToNextBracket: () => potencyToNextBracket,
    priceFor: () => priceFor,
    rearrangeBoard: () => rearrangeBoard,
    refreshShop: () => refreshShop,
    refreshShopWithCost: () => refreshShopWithCost,
    removeFromHand: () => removeFromHand,
    removeFromPoolWhere: () => removeFromPoolWhere,
    reputationReward: () => reputationReward,
    resolveCustomer: () => resolveCustomer,
    returnToPool: () => returnToPool,
    rollShop: () => rollShop,
    rollUnitsPerInteraction: () => rollUnitsPerInteraction,
    roundsUntilPayday: () => roundsUntilPayday,
    runActionToCompletion: () => runActionToCompletion,
    selectActivePotionTypes: () => selectActivePotionTypes,
    sellAtPayday: () => sellAtPayday,
    sellHirelingFromBoard: () => sellHirelingFromBoard,
    sellHirelingFromBoardToPool: () => sellHirelingFromBoardToPool,
    sellHirelingFromHand: () => sellHirelingFromHand,
    sellHirelingFromHandToPool: () => sellHirelingFromHandToPool,
    setOpponent: () => setOpponent,
    setPrice: () => setPrice,
    setWeather: () => setWeather,
    settleRound: () => settleRound,
    shuffle: () => shuffle,
    startShopPhase: () => startShopPhase,
    survivePayday: () => survivePayday,
    takeFromOffering: () => takeFromOffering,
    takeFromPool: () => takeFromPool,
    tick: () => tick,
    tickAction: () => tickAction,
    tickPatience: () => tickPatience,
    tickWeather: () => tickWeather,
    toCsv: () => toCsv,
    unitsRange: () => unitsRange,
    wageFor: () => wageFor,
    weightedLeadScore: () => weightedLeadScore
  });

  // src/cards/keywords.ts
  var COUNTED_KEYWORDS = [
    "Knockoff",
    "Haggle",
    "Quickcraft"
  ];
  var definitions = [
    {
      name: "Sabotage",
      acceptsCount: false,
      coding: "Increases one opponent hireling's cast time by 1s until the end of the current action round. Some hirelings specify which opponent hireling is targeted (highest cast time, lowest cast time, random etc). If no target is specified, the target is random.",
      player: "Increase an opponent hireling's cast time by 1s (until end of round)."
    },
    {
      name: "Bewitch",
      acceptsCount: false,
      coding: "This hireling gains customer Focus, drawing one customer's attention to your side. After this hireling sells to a Bewitched customer, its next Bewitch affects one additional customer simultaneously. Maximum of 2 customers Bewitched at a time.",
      player: "This hireling gains customer Focus. After it sells, its next Bewitch affects an additional customer. (Up to 2 customers at a time.)"
    },
    {
      name: "Knockoff",
      acceptsCount: true,
      coding: "After this hireling sells, if its current potency is below 10, gain +X permanent stock. X is determined by the number following the keyword on the card.",
      player: "After this hireling sells, if its potency is below 10, gain +X stock (permanently)."
    },
    {
      name: "Haggle",
      acceptsCount: true,
      coding: "Potions sold by this hireling are automatically priced 3g above the player's set price for that potion type. This happens passively with no player input required. Each Haggle sale costs -1 reputation. This modifier is per hireling and does not appear in the potion pricing panel.",
      player: "Potions sold by this hireling can be priced up to 3g above their set price; those sales grant -1 reputation."
    },
    {
      name: "Quickcraft",
      acceptsCount: true,
      coding: "This hireling's base stock is always 0. After this hireling casts its action, gain +X temporary stock. X is determined by the number following the keyword on the card. Temporary stock is generated during action phase only and resets to 0 at the start of each shop round.",
      player: "Base stock is 0. After this acts, gain +X temporary stock."
    },
    {
      name: "Charm",
      acceptsCount: false,
      coding: "Marks a one-time-use spell granted to the player's hand when a Charmed hireling is played onto the board. Charm cards are not part of the shop pool.",
      player: "One-time-use spell from a Charmed hireling."
    }
  ];
  var KEYWORDS = new Map(
    definitions.map((d) => [d.name, d])
  );
  var ALL_KEYWORDS = definitions;
  function getKeywordDefinition(name) {
    return KEYWORDS.get(name);
  }
  function keywordAcceptsCount(name) {
    var _a, _b;
    return (_b = (_a = KEYWORDS.get(name)) == null ? void 0 : _a.acceptsCount) != null ? _b : false;
  }

  // src/cards/csv-parser.ts
  function parseCsv(text) {
    var _a;
    const cells = tokenize(text);
    if (cells.length === 0) {
      return { headers: [], rows: [] };
    }
    const [headerRow, ...dataRows] = cells;
    const headers = headerRow.map((h) => h.trim());
    const rows = [];
    for (const row of dataRows) {
      if (row.length === 1 && row[0] === "") continue;
      const record = {};
      for (let i = 0; i < headers.length; i++) {
        record[headers[i]] = ((_a = row[i]) != null ? _a : "").trim();
      }
      rows.push(record);
    }
    return { headers, rows };
  }
  function tokenize(text) {
    const rows = [];
    let current = [];
    let field = "";
    let inQuotes = false;
    let i = text.charCodeAt(0) === 65279 ? 1 : 0;
    while (i < text.length) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        field += ch;
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ",") {
        current.push(field);
        field = "";
        i++;
        continue;
      }
      if (ch === "\r") {
        i++;
        continue;
      }
      if (ch === "\n") {
        current.push(field);
        rows.push(current);
        current = [];
        field = "";
        i++;
        continue;
      }
      field += ch;
      i++;
    }
    if (field.length > 0 || current.length > 0) {
      current.push(field);
      rows.push(current);
    }
    return rows;
  }

  // src/cards/loader.ts
  var HIRELING_GUILDS = /* @__PURE__ */ new Set([
    "Sugar Guild",
    "Thieves Guild",
    "Nobles Guild",
    "No Guild"
  ]);
  var ALL_GUILDS = /* @__PURE__ */ new Set([
    ...HIRELING_GUILDS,
    "Spell"
  ]);
  var WAGE_TIERS = /* @__PURE__ */ new Set([
    "Low",
    "Medium",
    "High",
    "None"
  ]);
  var KEYWORD_NAMES = /* @__PURE__ */ new Set([
    "Sabotage",
    "Bewitch",
    "Knockoff",
    "Haggle",
    "Quickcraft",
    "Charm"
  ]);
  var DEFAULT_CARDS_CSV_PATH = "embedded:cards.csv";
  function parseCards(csv) {
    const { rows } = parseCsv(csv);
    return rows.map((row, index) => parseRow(row, index + 2));
  }
  var EMBEDDED_CARDS_CSV = `Guild,Name,Star Rating,Wage Tier,Round Available,Pool Count,Potion 1 Stock,Potion 1 Potency,Potion 2 Stock,Potion 2 Potency,Cast Time,Keywords,Ability Text
Sugar Guild,Doughboy,,Low,1,4,,4,,,5s,Quickcraft x2,Quickcraft x2.
Sugar Guild,Pantry Stocker,,Low,1,4,2,3,,,Passive,,+1 stock each round.
Sugar Guild,Cookie Seller,,Low,1,4,4,1,,,Passive,,First sale each round grants +1 gold.
Sugar Guild,Apprentice Baker,,Low,1,4,3,3,,,4s,,"After an ally uses Quickcraft, gain +1 temporary stock."
Sugar Guild,Batter Boy,,Low,2,4,,3,,4,5s,Quickcraft x2,"Quickcraft x2. Each time an opponent sabotages you this round, gain +3 temporary stock."
Sugar Guild,Candied Witch,,Low,3,3,,5,,4,5s,Quickcraft x3 / Bewitch,Quickcraft x3. Bewitch one customer.
Sugar Guild,Burnt Batch,,Low,2,4,,4,,,3s,Quickcraft x2,"Quickcraft x2. If this sells nothing this round, gain +6 potency permanently."
Sugar Guild,Sugar Sprinkler,,Medium,4,3,,5,,,5s,,Adjacent allies gain +1 potency (permanent).
Sugar Guild,Sample Server,,Medium,4,3,1,5,,,Passive,,First stock each round sells immediately.
Sugar Guild,Glazier,,Medium,4,3,,5,,6,6s,Quickcraft x4,"Quickcraft x4. If total temporary stock generated this round exceeds 10, gain +3 permanent potency."
Sugar Guild,Sugar Rush Peddler,,Medium,5,3,,6,,5,6s,Quickcraft x4,Quickcraft x4. Each sale this round reduces cast time by 0.5s until end of round.
Sugar Guild,Confectioner,,Medium,5,3,,6,,7,7s,Quickcraft x4 / Haggle,"Quickcraft x4. Haggle. After this sells, all Sugar Guild allies gain +1 potency permanently."
Sugar Guild,Tasting Table,,Medium,4,3,2,4,,,5s,,"When a customer walks away without buying from any hireling, redirect them to this hireling. If they buy, all Sugar Guild allies gain +1 temporary stock."
Sugar Guild,Frosted Lookout,,Medium,5,3,,5,,,5s,Quickcraft x3,"Quickcraft x3. When an opponent uses Sabotage, immediately trigger your highest potency Sugar Guild ally's ability."
Sugar Guild,Oven Master,\u2B50,High,6,3,,7,,7,6s,Quickcraft x5,Quickcraft x5. Allies gain +2 potency (permanent).
Sugar Guild,Rush Order Cook,,High,6,3,,6,,7,8s,Quickcraft x2,Quickcraft x2. -1s cast time for each other Sugar Guild ally.
Sugar Guild,Sugar Crash,,High,7,3,,8,,6,7s,Quickcraft x5 / Bewitch,"Quickcraft x5. Once per round, when your total temporary stock hits 20, all customers in the middle zone are Bewitched simultaneously."
Sugar Guild,The Candy Architect,,High,7,3,,7,,8,8s,Quickcraft x6,"Quickcraft x6. Each time any Sugar Guild ally gains permanent potency this round, this hireling's next Quickcraft generates +2 additional stock."
Sugar Guild,Gingerbread King,\u2B50,High,9,2,,8,,12,8s,Quickcraft x10,"Quickcraft x10. After an ally sells, gain +2 potency (permanent)."
Sugar Guild,The Muffin Man,\u2B50,High,10,2,,10,,10,10s,Quickcraft x10,Quickcraft x10. Allies with Quickcraft gain +2 Quickcraft (permanent).
Thieves Guild,Robbin Goblin,,Low,1,4,3,2,,,4s,Knockoff x1,"Knockoff x1. If potency is below 5, steal +1 permanent stock from opponent's lowest potency hireling."
Thieves Guild,Pickpocket Pixie,,Low,1,4,2,2,2,3,4s,,"After this sells, gain +1 temporary stock for every Thieves hireling in play (including opponent's)."
Thieves Guild,Snitch Witch,,Low,2,4,3,3,,,5s,Knockoff x1,"Knockoff x1. Once per round, when an ally uses Sabotage, gain +1 permanent stock."
Thieves Guild,Miss Fortune Teller,\u2B50,Low,2,4,2,3,3,2,5s,Knockoff x1,"Knockoff x1. At the start of the shop round, gain +1 permanent stock for each customer that the opponent won."
Thieves Guild,Nimble Ned,,Low,3,3,3,3,3,4,5s,Knockoff x2,"Knockoff x2. When a customer buys nothing from your hirelings, pickpocket +1 gold from them, if you have at least 2 other Thieves Guild allies in play."
Thieves Guild,Street Rat,,Medium,4,3,4,3,3,3,5s,Knockoff x2 / Haggle,"Knockoff x2. Haggle. If Haggled sale succeeds, gain +2 permanent stock."
Thieves Guild,Snatchling,,Medium,4,3,4,4,,,6s,Knockoff x2,Knockoff x2. Spend -1 Reputation. Gain +4 permanent stock.
Thieves Guild,Sticky Fingers,,Medium,4,3,3,4,4,3,6s,Knockoff x2 / Sabotage,Knockoff x2. Sabotage opponent's lowest cast time hireling. Gain +2 temporary stock.
Thieves Guild,Masked Minstrel,,Medium,5,3,3,4,4,4,6s,Knockoff x2 / Bewitch,"Knockoff x2. Bewitch one customer. If the Bewitched customer buys, gain +3 permanent stock instead of gold."
Thieves Guild,The Saboteur,,Medium,5,3,4,4,,,6s,Sabotage x2 / Knockoff x1,"Sabotage x2. Knockoff x1. Each time this Sabotages successfully this round, all Thieves allies gain +0.5s cast time reduction until end of round."
Thieves Guild,Grumblegut Dragon,,High,6,3,6,3,5,3,7s,Knockoff x3,Knockoff x3. Eat +2 potency permanently from each adjacent hireling. Gain +1 permanent stock per potency eaten.
Thieves Guild,Cloaked Crook,,High,6,3,5,4,4,5,7s,Knockoff x3,"Knockoff x3. If this hireling has not been Bewitched or targeted this round, gain +4 permanent stock."
Thieves Guild,Fence Master,,High,7,3,5,5,5,4,7s,Knockoff x3 / Haggle,Knockoff x3. Haggle. Spend -1 Reputation. All Thieves allies gain +1 permanent stock.
Thieves Guild,The Highwayman,\u2B50,High,7,3,4,6,5,5,7s,Knockoff x3 / Sabotage / Bewitch,Knockoff x3. Sabotage. Bewitch.
Thieves Guild,Crooked Confessor,,High,7,3,4,5,5,4,7s,Knockoff x2,"Knockoff x2. If this hireling is in play, all ally Haggle sales no longer cost Reputation."
Thieves Guild,Goblin King,\u2B50,High,8,2,6,5,5,6,8s,Knockoff x4,"Knockoff x4. If Robbin Goblin is on your board, both gain +3 permanent stock and +1 permanent potency."
Thieves Guild,Prince of Thieves,,High,9,2,5,7,6,6,8s,Knockoff x4,Knockoff x4. Spend -2 Reputation. Curse opponent's highest potency hireling \u2014 it adds 3 seconds to their current cast.
Thieves Guild,The Grand Thief,,High,9,2,6,6,7,5,9s,Knockoff x5,"Knockoff x5. For each Thieves ally with Knockoff, gain +2 temporary stock. All Thieves allies trigger Knockoff x1 immediately."
Thieves Guild,Puss in Boots,\u2B50\u2B50,High,10,2,7,7,8,6,9s,Knockoff x5 / Haggle,Knockoff x5. Haggle. Steal 1 Reputation star from each customer (they must have more than 1 reputation star). Gain +1 permanent stock per star stolen.
Nobles Guild,The Page,,Low,1,4,2,3,,,4s,,"When an ally sells, gain +1 temporary stock."
Nobles Guild,Lady's Maid,,Low,1,4,2,3,3,2,4s,Bewitch,"Bewitch. After Bewitch succeeds, a random ally gains +1 permanent potency."
Nobles Guild,Court Jester,,Low,2,4,3,3,2,4,5s,,"When any ally gains a stock buff, gain +1 temporary stock. When any ally gains a potency buff, gain +1 temporary potency."
Nobles Guild,The Squire,\u2B50,Low,2,4,4,1,4,1,5s,Bewitch,"Bewitch. If a Knight Errant is adjacent, copy his cast time and action."
Nobles Guild,The Herald,,Medium,4,3,4,4,3,5,5s,,All Nobles Guild allies gain +1 temporary stock.
Nobles Guild,Knight Errant,,Medium,4,3,4,5,4,4,6s,Bewitch,"Bewitch. If Bewitched customer has 3 or more reputation stars, gain +3 permanent potency."
Nobles Guild,Royal Advisor,,Medium,5,3,3,5,4,5,1-8s (random),Sabotage,"Sabotage an ally. If it is a Nobles Guild ally, that ally's next action gains +2 to all stat effects permanently."
Nobles Guild,The Duchess,\u2B50,Medium,5,3,4,5,5,4,6s,,"Only applies to Nobles Guild Allies: All allies to the left gain +1 permanent stock. All allies to the right gain +1 permanent potency. If she has at least one Nobles Guild ally on both sides, she also gains the same stats."
Nobles Guild,The Royal Tutor,,Medium,5,3,3,4,4,3,6s,,Choose one ally. That ally's next action gains +1 to all stat effects permanently. Cannot buff another Royal Tutor.
Nobles Guild,The Court Scribe,,Medium,5,3,4,4,3,5,6s,,The last permanent buff any ally gained this round is increased by +1 permanently.
Nobles Guild,Royal Treasurer,,High,6,3,5,5,4,6,Passive,,"At the end of each action round, gain +1 gold for each Noble ally that sold at least once last round."
Nobles Guild,The Champion Knight,\u2B50,High,6,3,5,6,6,5,7s,Bewitch,"Bewitch the highest reputation customer only. If they buy, all Nobles Guild allies gain +2 permanent potency."
Nobles Guild,Lord Chamberlain,\u2B50,High,7,3,5,6,6,6,7s,,All Nobles Guild allies gain +1 permanent stock and +1 permanent potency. This effect doubles during the action round immediately following payday.
Nobles Guild,The Grand Vizier,\u2B50,High,7,3,6,6,5,7,7s (reduces by 1s per cast),,"Copy the last permanent buff any ally received and apply it to himself. Once cast time reaches 0, he stops casting permanently."
Nobles Guild,The Kingmaker,\u2B50,High,7,3,5,5,4,6,10s,,Choose one Nobles Guild ally. Potency gains through actions are doubled for that ally. (Temporary effect.)
Nobles Guild,The Prince,\u2B50,High,9,2,7,7,6,8,9s,Bewitch,"Bewitch the highest reputation customer only. If they buy, gain +3 permanent potency and all Noble allies gain +1 permanent potency."
Nobles Guild,The Queen,\u2B50\u2B50,High,10,2,8,8,7,9,9s,Bewitch,Bewitch. Grant all customers currently in the middle zone +1 reputation. (This effect cannot be buffed.)
No Guild,Dusty Broom,,None,1,4,5,1,,,5s,,Cannot be Sabotaged. Cannot be buffed. Starting hireling \u2014 given to player for free.
No Guild,Jumping Jack,,Low,1,4,3,3,2,4,5s,,"After this sells, gain +1 permanent stock and +1 permanent potency."
No Guild,Almost-A-Knight,,Low,1,4,4,3,3,3,5s,Haggle,"Haggle. If Haggled sale succeeds, gain +2 temporary stock."
No Guild,Part-Time Potioneer,,Medium,3,3,3,5,4,4,6s,Bewitch,"Bewitch. After Bewitch succeeds, gain +2 permanent potency."
No Guild,Tower Escapee,,Medium,3,3,4,4,5,3,6s,,Reduce the cast time of a random active hireling by 1s for this round only.
No Guild,Spare Charming,,Low,2,4,2,2,2,2,4s,Knockoff x1 / Haggle,"Knockoff x1. Haggle. If Haggled sale fails, gain +3 permanent potency."
No Guild,Ogreachiever,,High,7,3,5,6,4,7,8s,,All active hirelings gain +1 permanent potency. (Does not apply to hirelings with Quickcraft.)
Spell,Bottomless Bottle,,N/A,N/A,3,N/A,N/A,N/A,N/A,N/A,None,Grant one hireling of your choice +3 permanent stock. (Does not apply to hirelings with Quickcraft.)
Spell,Potion Polish,,N/A,N/A,3,N/A,N/A,N/A,N/A,N/A,None,Grant one hireling of your choice +3 permanent potency.
Spell,Star Power,,N/A,N/A,3,N/A,N/A,N/A,N/A,N/A,None,"The first 3 customers in the next action round will all have +1 reputation. (This effect cannot stack, only castable once per shop phase.)"
Spell,Talent Scout,,N/A,N/A,3,N/A,N/A,N/A,N/A,N/A,None,The next shop refresh is free and guaranteed to contain at least one hireling from your most represented guild.
Spell,Spring Cleaning,,N/A,6,3,N/A,N/A,N/A,N/A,N/A,None,Remove all Tier 1 hirelings from the card pool permanently. This spell returns to the pool upgraded.
Spell,Spring Cleaning (Upgraded),,N/A,6,3,N/A,N/A,N/A,N/A,N/A,None,Remove all Tier 2 hirelings from the card pool permanently.
Spell,Tip Jar Charm,,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,Charm,Gain +3 gold.
Spell,Second Chance Charm,,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,Charm,Refresh the shop for free.
Spell,Lucky Charm,,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,Charm,Give a friendly hireling +3 permanent potency.
`;
  function loadCards(_filepath) {
    return parseCards(EMBEDDED_CARDS_CSV);
  }
  var cachedCards = null;
  function getAllCards() {
    if (cachedCards === null) {
      cachedCards = Object.freeze(loadCards());
    }
    return cachedCards;
  }
  function parseRow(row, lineNumber) {
    const guild = row["Guild"];
    if (!ALL_GUILDS.has(guild)) {
      throw new Error(`Line ${lineNumber}: unknown Guild "${row["Guild"]}".`);
    }
    return guild === "Spell" ? parseSpell(row, lineNumber) : parseHireling(row, guild, lineNumber);
  }
  function parseHireling(row, guild, lineNumber) {
    var _a;
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
      abilityText: (_a = row["Ability Text"]) != null ? _a : ""
    };
  }
  function parseSpell(row, lineNumber) {
    var _a;
    const name = required(row, "Name", lineNumber);
    return {
      kind: "spell",
      id: kebab(name),
      name,
      starRating: parseStarRating(row["Star Rating"]),
      roundAvailable: parseOptionalInt(row["Round Available"]),
      poolCount: parseOptionalInt(row["Pool Count"]),
      keywords: parseKeywords(row["Keywords"], lineNumber),
      abilityText: (_a = row["Ability Text"]) != null ? _a : ""
    };
  }
  function required(row, column, lineNumber) {
    const value = row[column];
    if (!value) {
      throw new Error(`Line ${lineNumber}: missing required column "${column}".`);
    }
    return value;
  }
  function parseWageTier(raw, lineNumber) {
    const value = (raw != null ? raw : "").trim();
    if (!WAGE_TIERS.has(value)) {
      throw new Error(`Line ${lineNumber}: unknown Wage Tier "${raw}".`);
    }
    return value;
  }
  function parseStarRating(raw) {
    var _a;
    const value = (raw != null ? raw : "").trim();
    if (value === "") return 0;
    if (value === "\u2B50") return 1;
    if (value === "\u2B50\u2B50") return 2;
    const stars = ((_a = value.match(/⭐/g)) != null ? _a : []).length;
    if (stars === 1) return 1;
    if (stars === 2) return 2;
    return 0;
  }
  function parseRequiredInt(raw, column, lineNumber) {
    const value = (raw != null ? raw : "").trim();
    const n = Number(value);
    if (!Number.isInteger(n)) {
      throw new Error(
        `Line ${lineNumber}: "${column}" must be an integer (got "${raw}").`
      );
    }
    return n;
  }
  function parseOptionalInt(raw) {
    const value = (raw != null ? raw : "").trim();
    if (value === "" || value.toUpperCase() === "N/A") return null;
    const n = Number(value);
    return Number.isInteger(n) ? n : null;
  }
  function parsePotions(row, lineNumber) {
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
    const potions = [];
    if (slot1) potions.push(slot1);
    if (slot2) potions.push(slot2);
    if (potions.length === 0) {
      throw new Error(`Line ${lineNumber}: hireling has no potion potency set.`);
    }
    return potions;
  }
  function parsePotion(rawStock, rawPotency, lineNumber, label) {
    const stockStr = (rawStock != null ? rawStock : "").trim();
    const potencyStr = (rawPotency != null ? rawPotency : "").trim();
    if (potencyStr === "" || potencyStr.toUpperCase() === "N/A") {
      return null;
    }
    const potency = Number(potencyStr);
    if (!Number.isInteger(potency)) {
      throw new Error(
        `Line ${lineNumber}: ${label} potency must be an integer (got "${rawPotency}").`
      );
    }
    const stock = stockStr === "" ? 0 : Number(stockStr);
    if (!Number.isInteger(stock)) {
      throw new Error(
        `Line ${lineNumber}: ${label} stock must be an integer or blank (got "${rawStock}").`
      );
    }
    return { stock, potency };
  }
  function parseCastTime(raw, lineNumber) {
    const value = (raw != null ? raw : "").trim();
    if (value === "" || value.toUpperCase() === "N/A") {
      throw new Error(
        `Line ${lineNumber}: hireling Cast Time cannot be empty or N/A.`
      );
    }
    if (/^passive$/i.test(value)) return { kind: "passive" };
    const range = value.match(/^(\d+)\s*-\s*(\d+)\s*s\s*\(random\)\s*$/i);
    if (range) {
      return {
        kind: "random",
        min: Number(range[1]),
        max: Number(range[2])
      };
    }
    const decreasing = value.match(
      /^(\d+)\s*s\s*\(reduces by (\d+)\s*s per cast\)\s*$/i
    );
    if (decreasing) {
      return {
        kind: "decreasing",
        start: Number(decreasing[1]),
        decrementPerCast: Number(decreasing[2])
      };
    }
    const fixed = value.match(/^(\d+(?:\.\d+)?)\s*s$/i);
    if (fixed) return { kind: "seconds", value: Number(fixed[1]) };
    throw new Error(`Line ${lineNumber}: unrecognised Cast Time "${raw}".`);
  }
  function parseKeywords(raw, lineNumber) {
    const value = (raw != null ? raw : "").trim();
    if (value === "" || /^none$/i.test(value)) return [];
    return value.split(/\s*\/\s*/).map((token) => parseKeyword(token, lineNumber));
  }
  function parseKeyword(token, lineNumber) {
    const match = token.match(/^([A-Za-z]+)(?:\s*x(\d+))?$/);
    if (!match) {
      throw new Error(`Line ${lineNumber}: unrecognised keyword "${token}".`);
    }
    const name = match[1];
    const countStr = match[2];
    if (!KEYWORD_NAMES.has(name)) {
      throw new Error(`Line ${lineNumber}: unknown keyword "${name}".`);
    }
    if (countStr !== void 0) {
      return { name, count: Number(countStr) };
    }
    return { name };
  }
  function kebab(name) {
    return name.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // src/cards/hirelings.ts
  var ALL_HIRELINGS = getAllCards().filter(
    (c) => c.kind === "hireling"
  );

  // src/cards/spells.ts
  var ALL_SPELLS = getAllCards().filter(
    (c) => c.kind === "spell"
  );

  // src/economy/gold.ts
  var STARTING_GOLD = 5;
  var COST_HIRELING = 2;
  var COST_SPELL = 2;
  var COST_REFRESH = 1;
  var SELL_VALUE = 1;
  function canAfford(gold, cost) {
    return gold >= cost;
  }

  // src/economy/wages.ts
  var MAX_PAYDAYS = 4;
  var WAGE_SCHEDULE = {
    Low: [2, 4, 6, 8, 10],
    Medium: [4, 6, 8, 10, 12],
    High: [6, 8, 10, 12, 14],
    None: [0, 0, 0, 0, 0]
  };
  function createWageTracker(tier) {
    return { tier, paydaysSurvived: 0, lastPaidRound: 0 };
  }
  function wageFor(tier, paydayNumber) {
    if (!Number.isInteger(paydayNumber) || paydayNumber < 1 || paydayNumber > MAX_PAYDAYS) {
      throw new Error(
        `paydayNumber must be an integer in 1..${MAX_PAYDAYS} (got ${paydayNumber}).`
      );
    }
    return WAGE_SCHEDULE[tier][paydayNumber - 1];
  }
  function currentWageDemand(tracker) {
    return wageFor(tracker.tier, tracker.paydaysSurvived + 1);
  }
  function survivePayday(tracker, round = 0) {
    if (tracker.paydaysSurvived >= MAX_PAYDAYS) {
      throw new Error(
        `Hireling has already survived the maximum of ${MAX_PAYDAYS} paydays.`
      );
    }
    return {
      ...tracker,
      paydaysSurvived: tracker.paydaysSurvived + 1,
      lastPaidRound: round
    };
  }
  function isExemptFromPayday(tracker) {
    return tracker.tier === "None";
  }

  // src/economy/payday.ts
  var PAYDAY_ROUNDS = Object.freeze([
    5,
    8,
    11,
    14
  ]);
  var GLOW_ROUNDS = Object.freeze([
    4,
    7,
    10,
    13
  ]);
  function isPaydayRound(round) {
    return PAYDAY_ROUNDS.includes(round);
  }
  function isGlowRound(round) {
    return GLOW_ROUNDS.includes(round);
  }
  function paydayIndex(round) {
    const idx = PAYDAY_ROUNDS.indexOf(round);
    return idx === -1 ? null : idx + 1;
  }
  function nextPaydayRound(currentRound) {
    for (const r of PAYDAY_ROUNDS) {
      if (r >= currentRound) return r;
    }
    return null;
  }
  function roundsUntilPayday(currentRound) {
    const next = nextPaydayRound(currentRound);
    return next === null ? null : next - currentRound;
  }
  function buildPaydayLineItems(gold, trackers) {
    return trackers.filter((t) => !isExemptFromPayday(t)).map((tracker) => {
      const wage = currentWageDemand(tracker);
      return {
        tracker,
        wage,
        canPay: canAfford(gold, wage),
        sellValue: SELL_VALUE
      };
    });
  }

  // src/board/hand.ts
  var MAX_HAND_SIZE = 8;
  function createHirelingInstance(card, id, potionType = null, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
      id,
      card,
      wageTracker: createWageTracker(card.wageTier),
      potionType,
      potionType2: (_a = options.potionType2) != null ? _a : null,
      permanentStockBonus: (_b = options.permanentStockBonus) != null ? _b : 0,
      permanentPotencyBonus: (_c = options.permanentPotencyBonus) != null ? _c : 0,
      permanentStockBonus2: (_d = options.permanentStockBonus2) != null ? _d : 0,
      permanentPotencyBonus2: (_e = options.permanentPotencyBonus2) != null ? _e : 0,
      charmed: (_f = options.charmed) != null ? _f : false,
      acquiredAtRound: (_g = options.acquiredAtRound) != null ? _g : 0
    };
  }
  function createSpellInstance(card, id) {
    return { id, card };
  }
  function createHand() {
    return { cards: [] };
  }
  function handSize(hand) {
    return hand.cards.length;
  }
  function isHandFull(hand) {
    return hand.cards.length >= MAX_HAND_SIZE;
  }
  function addToHand(hand, card) {
    if (isHandFull(hand)) {
      throw new Error(`Hand is full (max ${MAX_HAND_SIZE}).`);
    }
    return { cards: [...hand.cards, card] };
  }
  function removeFromHand(hand, index) {
    const removed = hand.cards[index];
    if (!removed) {
      throw new Error(`No card at hand index ${index}.`);
    }
    const cards = hand.cards.filter((_, i) => i !== index);
    return { hand: { cards }, removed };
  }
  function isHireling(card) {
    return card.card.kind === "hireling";
  }
  function isSpell(card) {
    return card.card.kind === "spell";
  }

  // src/board/board.ts
  var BOARD_SIZE = 7;
  var BENCH_SLOTS = Object.freeze([0, 6]);
  var ACTIVE_SLOTS = Object.freeze([1, 2, 3, 4, 5]);
  var STARTER_SLOT = 3;
  function createBoard() {
    return { slots: Array(BOARD_SIZE).fill(null) };
  }
  function isBenchSlot(slot) {
    return BENCH_SLOTS.includes(slot);
  }
  function isActiveSlot(slot) {
    return ACTIVE_SLOTS.includes(slot);
  }
  function isBoardFull(board) {
    return board.slots.every((s) => s !== null);
  }
  function firstEmptySlot(board) {
    const i = board.slots.findIndex((s) => s === null);
    return i === -1 ? null : i;
  }
  function activeHirelings(board) {
    return ACTIVE_SLOTS.map((i) => board.slots[i]).filter(
      (h) => h !== null
    );
  }
  function benchHirelings(board) {
    return BENCH_SLOTS.map((i) => board.slots[i]).filter(
      (h) => h !== null
    );
  }
  function allHirelings(board) {
    return board.slots.filter((h) => h !== null);
  }
  function assertSlotInRange(slot) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= BOARD_SIZE) {
      throw new Error(
        `Slot index must be an integer in 0..${BOARD_SIZE - 1} (got ${slot}).`
      );
    }
  }
  function placeHireling(board, slot, instance) {
    assertSlotInRange(slot);
    if (board.slots[slot] !== null) {
      throw new Error(`Slot ${slot} is already occupied.`);
    }
    const slots = board.slots.slice();
    slots[slot] = instance;
    return { slots };
  }
  function playHirelingFromHand(board, hand, handIndex, slot) {
    assertSlotInRange(slot);
    const card = hand.cards[handIndex];
    if (!card) {
      throw new Error(`No card at hand index ${handIndex}.`);
    }
    if (!isHireling(card)) {
      throw new Error(`Card at hand index ${handIndex} is not a hireling.`);
    }
    if (board.slots[slot] !== null) {
      throw new Error(`Slot ${slot} is already occupied.`);
    }
    const { hand: nextHand } = removeFromHand(hand, handIndex);
    const nextBoard = placeHireling(board, slot, card);
    return { board: nextBoard, hand: nextHand };
  }
  function sellHirelingFromBoard(board, slot) {
    assertSlotInRange(slot);
    const sold = board.slots[slot];
    if (!sold) {
      throw new Error(`Slot ${slot} is empty \u2014 nothing to sell.`);
    }
    const slots = board.slots.slice();
    slots[slot] = null;
    return { board: { slots }, sold, sellValue: SELL_VALUE };
  }
  function sellHirelingFromHand(hand, handIndex) {
    const card = hand.cards[handIndex];
    if (!card) {
      throw new Error(`No card at hand index ${handIndex}.`);
    }
    if (!isHireling(card)) {
      throw new Error("Spells cannot be sold.");
    }
    const { hand: nextHand } = removeFromHand(hand, handIndex);
    return { hand: nextHand, sold: card, sellValue: SELL_VALUE };
  }
  function rearrangeBoard(board, fromSlot, toSlot) {
    assertSlotInRange(fromSlot);
    assertSlotInRange(toSlot);
    if (fromSlot === toSlot) return board;
    const moving = board.slots[fromSlot];
    if (!moving) {
      throw new Error(`Cannot rearrange: slot ${fromSlot} is empty.`);
    }
    const slots = board.slots.slice();
    slots.splice(fromSlot, 1);
    slots.splice(toSlot, 0, moving);
    return { slots };
  }

  // src/potions/rng.ts
  var defaultRng = Math.random;
  function mulberry32(seed) {
    let state = seed >>> 0;
    return () => {
      state = state + 1831565813 >>> 0;
      let t = state;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(items, rng) {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function pick(items, rng) {
    if (items.length === 0) {
      throw new Error("pick() called on empty array.");
    }
    return items[Math.floor(rng() * items.length)];
  }

  // src/board/starter.ts
  function createDustyBroomInstance(card, id = "starter-dusty-broom") {
    if (card.id !== "dusty-broom") {
      throw new Error(
        `createDustyBroomInstance expected the Dusty Broom card (got "${card.id}").`
      );
    }
    return createHirelingInstance(card, id);
  }
  function createStarterState(dustyBroom) {
    const board = placeHireling(createBoard(), STARTER_SLOT, dustyBroom);
    return { board, hand: createHand() };
  }
  function createStarterBoard(dustyBroomCard, activeTypes, rng, id = "starter-dusty-broom") {
    if (activeTypes.length === 0) {
      throw new Error("createStarterBoard requires at least one active type.");
    }
    const base = createDustyBroomInstance(dustyBroomCard, id);
    const broom = { ...base, potionType: pick(activeTypes, rng) };
    const { board, hand } = createStarterState(broom);
    return { board, hand, broom };
  }

  // src/potions/types.ts
  var POTION_TYPES = Object.freeze([
    { id: "love", name: "Love Potion", icon: "\u2764\uFE0F", flavor: "Results may vary" },
    {
      id: "dragons-breath",
      name: "Dragon's Breath Tonic",
      icon: "\u{1F525}",
      flavor: "A little spicy, a little smelly"
    },
    {
      id: "mermaids-tears",
      name: "Mermaid's Tears Elixir",
      icon: "\u{1F4A7}",
      flavor: "Not a product of a happy ending"
    },
    {
      id: "goblins-greed",
      name: "Goblin's Greed Brew",
      icon: "\u{1F4B0}",
      flavor: "It's mine, mine, mine!"
    },
    { id: "luck", name: "Luck Potion", icon: "\u{1F340}", flavor: "" },
    { id: "half-curse-cure", name: "Half-Curse Cure", icon: "\u{1F480}", flavor: "" },
    {
      id: "flutterfix",
      name: "Flutterfix Tonic",
      icon: "\u{1FABD}",
      flavor: "Fixes wings"
    }
  ]);
  var ACTIVE_POTION_COUNT = 5;
  var POTION_BY_ID = new Map(
    POTION_TYPES.map((p) => [p.id, p])
  );
  function getPotionMeta(id) {
    return POTION_BY_ID.get(id);
  }

  // src/potions/selection.ts
  function selectActivePotionTypes(rng = defaultRng) {
    return shuffle(
      POTION_TYPES.map((p) => p.id),
      rng
    ).slice(0, ACTIVE_POTION_COUNT);
  }

  // src/potions/discovery.ts
  function createDiscovery() {
    return { seen: /* @__PURE__ */ new Set() };
  }
  function markSeen(discovery, id) {
    if (discovery.seen.has(id)) return discovery;
    const seen = new Set(discovery.seen);
    seen.add(id);
    return { seen };
  }
  function markSeenMany(discovery, ids) {
    const seen = new Set(discovery.seen);
    let changed = false;
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        changed = true;
      }
    }
    return changed ? { seen } : discovery;
  }
  function isSeen(discovery, id) {
    return discovery.seen.has(id);
  }
  function discoveredCount(discovery) {
    return discovery.seen.size;
  }

  // src/shop/pool.ts
  var EXCLUDED_HIRELING_IDS = /* @__PURE__ */ new Set(["dusty-broom"]);
  var EXCLUDED_SPELL_IDS = /* @__PURE__ */ new Set(["spring-cleaning-upgraded"]);
  function createInitialPool() {
    const instances = [];
    for (const card of ALL_HIRELINGS) {
      if (EXCLUDED_HIRELING_IDS.has(card.id)) continue;
      for (let i = 0; i < card.poolCount; i++) {
        instances.push({
          id: instanceIdFor(card, i),
          card,
          potionType: null
        });
      }
    }
    for (const card of ALL_SPELLS) {
      if (card.poolCount === null) continue;
      if (EXCLUDED_SPELL_IDS.has(card.id)) continue;
      for (let i = 0; i < card.poolCount; i++) {
        instances.push({
          id: instanceIdFor(card, i),
          card,
          potionType: null
        });
      }
    }
    return { instances };
  }
  function instanceIdFor(card, copyIndex) {
    return `${card.id}#${copyIndex}`;
  }
  function poolSize(pool) {
    return pool.instances.length;
  }
  function isInPool(pool, instanceId) {
    return pool.instances.some((i) => i.id === instanceId);
  }
  function countOfCard(pool, cardId) {
    return pool.instances.reduce(
      (n, i) => i.card.id === cardId ? n + 1 : n,
      0
    );
  }
  function poolHirelings(pool) {
    return pool.instances.filter((i) => i.card.kind === "hireling");
  }
  function poolSpells(pool) {
    return pool.instances.filter((i) => i.card.kind === "spell");
  }
  function poolAvailableAtRound(pool, round) {
    return pool.instances.filter((i) => {
      if (i.card.kind === "hireling") {
        return i.card.roundAvailable <= round;
      }
      if (i.card.roundAvailable === null) return true;
      return i.card.roundAvailable <= round;
    });
  }
  function takeFromPool(pool, instanceId) {
    const idx = pool.instances.findIndex((i) => i.id === instanceId);
    if (idx === -1) {
      throw new Error(`Instance "${instanceId}" is not in the pool.`);
    }
    const taken = pool.instances[idx];
    const instances = pool.instances.slice();
    instances.splice(idx, 1);
    return { pool: { instances }, taken };
  }
  function returnToPool(pool, instance) {
    if (isInPool(pool, instance.id)) {
      throw new Error(
        `Instance "${instance.id}" is already in the pool.`
      );
    }
    return { instances: [...pool.instances, instance] };
  }
  function removeFromPoolWhere(pool, predicate) {
    const kept = [];
    const removed = [];
    for (const inst of pool.instances) {
      (predicate(inst) ? removed : kept).push(inst);
    }
    return { pool: { instances: kept }, removed };
  }
  function isHirelingPoolInstance(inst) {
    return inst.card.kind === "hireling";
  }
  function isSpellPoolInstance(inst) {
    return inst.card.kind === "spell";
  }

  // src/shop/assignment.ts
  function assignPotionsToPool(pool, activeTypes, rng) {
    if (activeTypes.length === 0) {
      throw new Error("assignPotionsToPool requires at least one active type.");
    }
    const instances = pool.instances.map((inst) => {
      if (inst.card.kind !== "hireling") return inst;
      const slot1 = pick(activeTypes, rng);
      let slot2 = null;
      if (inst.card.potions.length >= 2 && activeTypes.length >= 2) {
        const remaining = activeTypes.filter((t) => t !== slot1);
        slot2 = pick(remaining, rng);
      }
      return { ...inst, potionType: slot1, potionType2: slot2 };
    });
    return { instances };
  }
  function assignHirelingPotion(instance, activeTypes, rng) {
    if (activeTypes.length === 0) {
      throw new Error("assignHirelingPotion requires at least one active type.");
    }
    return { ...instance, potionType: pick(activeTypes, rng) };
  }

  // src/shop/offering.ts
  var DEFAULT_SHOP_SIZE = 5;
  var DEFAULT_SPELL_CHANCE = 0.25;
  function createEmptyOffering(size = DEFAULT_SHOP_SIZE) {
    return { slots: Array(size).fill(null) };
  }
  function offeringInstances(offering) {
    return offering.slots.filter((s) => s !== null);
  }
  function offeringHirelings(offering) {
    return offeringInstances(offering).filter(isHirelingPoolInstance);
  }
  function offeringSpells(offering) {
    return offeringInstances(offering).filter(isSpellPoolInstance);
  }
  function rollShop(pool, round, rng, opts = {}) {
    var _a, _b;
    const size = (_a = opts.size) != null ? _a : DEFAULT_SHOP_SIZE;
    const spellChance = (_b = opts.spellChance) != null ? _b : DEFAULT_SPELL_CHANCE;
    const eligible = poolAvailableAtRound(pool, round);
    const hirelings = eligible.filter(isHirelingPoolInstance);
    const spells = eligible.filter(isSpellPoolInstance);
    const includeSpell = spells.length > 0 && rng() < spellChance;
    const hirelingTarget = includeSpell ? size - 1 : size;
    const picked = [];
    if (includeSpell) picked.push(pick(spells, rng));
    picked.push(...shuffle(hirelings, rng).slice(0, hirelingTarget));
    const arranged = shuffle(picked, rng);
    let nextPool = pool;
    for (const inst of arranged) {
      nextPool = takeFromPool(nextPool, inst.id).pool;
    }
    const slots = Array(size).fill(
      null
    );
    for (let i = 0; i < arranged.length; i++) slots[i] = arranged[i];
    return { offering: { slots }, pool: nextPool };
  }
  function refreshShop(offering, pool, round, rng, opts = {}) {
    let nextPool = pool;
    for (const inst of offeringInstances(offering)) {
      nextPool = returnToPool(nextPool, inst);
    }
    return rollShop(nextPool, round, rng, opts);
  }
  function takeFromOffering(offering, slot) {
    if (slot < 0 || slot >= offering.slots.length) {
      throw new Error(`Offering slot ${slot} out of range.`);
    }
    const taken = offering.slots[slot];
    if (!taken) {
      throw new Error(`Offering slot ${slot} is empty.`);
    }
    const slots = offering.slots.slice();
    slots[slot] = null;
    return { offering: { slots }, taken };
  }

  // src/shop/purchase.ts
  function disappearsOnSell(instance) {
    return instance.card.id === "dusty-broom" || instance.charmed;
  }
  function toPoolInstance(instance) {
    return {
      id: instance.id,
      card: instance.card,
      potionType: instance.potionType
    };
  }
  function buyHirelingFromShop(offering, shopSlot, hand, gold) {
    if (!canAfford(gold, COST_HIRELING)) {
      throw new Error(`Not enough gold to buy a hireling (need ${COST_HIRELING}).`);
    }
    if (isHandFull(hand)) {
      throw new Error("Cannot buy: hand is full.");
    }
    const peek = offering.slots[shopSlot];
    if (!peek || peek.card.kind !== "hireling") {
      throw new Error(`Shop slot ${shopSlot} is not a hireling.`);
    }
    const hirelingCard = peek.card;
    const { offering: nextOffering, taken } = takeFromOffering(offering, shopSlot);
    const hirelingInstance = createHirelingInstance(
      hirelingCard,
      taken.id,
      taken.potionType
    );
    return {
      offering: nextOffering,
      hand: addToHand(hand, hirelingInstance),
      gold: gold - COST_HIRELING
    };
  }
  function buySpellFromShop(offering, shopSlot, hand, gold) {
    if (!canAfford(gold, COST_SPELL)) {
      throw new Error(`Not enough gold to buy a spell (need ${COST_SPELL}).`);
    }
    if (isHandFull(hand)) {
      throw new Error("Cannot buy: hand is full.");
    }
    const peek = offering.slots[shopSlot];
    if (!peek || peek.card.kind !== "spell") {
      throw new Error(`Shop slot ${shopSlot} is not a spell.`);
    }
    const spellCard = peek.card;
    const { offering: nextOffering, taken } = takeFromOffering(offering, shopSlot);
    const spellInstance = createSpellInstance(spellCard, taken.id);
    return {
      offering: nextOffering,
      hand: addToHand(hand, spellInstance),
      gold: gold - COST_SPELL
    };
  }
  function refreshShopWithCost(offering, pool, round, rng, gold, opts) {
    if (!canAfford(gold, COST_REFRESH)) {
      throw new Error(`Not enough gold to refresh (need ${COST_REFRESH}).`);
    }
    const res = refreshShop(offering, pool, round, rng, opts);
    return { ...res, gold: gold - COST_REFRESH };
  }
  function sellHirelingFromHandToPool(hand, handIndex, pool, gold) {
    const res = sellHirelingFromHand(hand, handIndex);
    const nextPool = disappearsOnSell(res.sold) ? pool : returnToPool(pool, toPoolInstance(res.sold));
    return { hand: res.hand, pool: nextPool, gold: gold + res.sellValue };
  }
  function sellHirelingFromBoardToPool(board, slot, pool, gold) {
    const res = sellHirelingFromBoard(board, slot);
    const nextPool = disappearsOnSell(res.sold) ? pool : returnToPool(pool, toPoolInstance(res.sold));
    return { board: res.board, pool: nextPool, gold: gold + res.sellValue };
  }

  // src/shop/spring-cleaning.ts
  var SPRING_CLEANING_ID = "spring-cleaning";
  var SPRING_CLEANING_UPGRADED_ID = "spring-cleaning-upgraded";
  var UPGRADED_CARD = ALL_SPELLS.find(
    (s) => s.id === SPRING_CLEANING_UPGRADED_ID
  );
  if (!UPGRADED_CARD) {
    throw new Error(
      `Missing "${SPRING_CLEANING_UPGRADED_ID}" in ALL_SPELLS; cards.csv out of sync.`
    );
  }
  function isSpringCleaningId(id) {
    return id === SPRING_CLEANING_ID || id === SPRING_CLEANING_UPGRADED_ID;
  }
  function castSpringCleaning(hand, handIndex, pool) {
    const card = hand.cards[handIndex];
    if (!card || card.card.kind !== "spell") {
      throw new Error(`Hand index ${handIndex} is not a spell.`);
    }
    if (!isSpringCleaningId(card.card.id)) {
      throw new Error(
        `Hand index ${handIndex} is not a Spring Cleaning spell (got "${card.card.id}").`
      );
    }
    const { hand: nextHand } = removeFromHand(hand, handIndex);
    const isBase = card.card.id === SPRING_CLEANING_ID;
    const tierToRemove = isBase ? "Low" : "Medium";
    const res = removeFromPoolWhere(
      pool,
      (inst) => inst.card.kind === "hireling" && inst.card.wageTier === tierToRemove
    );
    let nextPool = res.pool;
    let upgradedPoolInstance = null;
    if (isBase) {
      upgradedPoolInstance = {
        id: `${SPRING_CLEANING_UPGRADED_ID}#from-${card.id}`,
        card: UPGRADED_CARD,
        potionType: null
      };
      nextPool = returnToPool(nextPool, upgradedPoolInstance);
    }
    return {
      hand: nextHand,
      pool: nextPool,
      removedHirelings: res.removed,
      upgradedPoolInstance
    };
  }

  // src/pricing/brackets.ts
  var PRICE_BRACKETS = Object.freeze([
    { minValue: 1, maxPrice: 1 },
    { minValue: 9, maxPrice: 2 },
    { minValue: 17, maxPrice: 3 },
    { minValue: 25, maxPrice: 4 },
    { minValue: 33, maxPrice: 5 },
    { minValue: 41, maxPrice: 6 },
    { minValue: 51, maxPrice: 7 },
    { minValue: 63, maxPrice: 8 }
  ]);
  var MIN_PRICE = 1;
  var MAX_PRICE = PRICE_BRACKETS[PRICE_BRACKETS.length - 1].maxPrice;
  var CAP_VALUE = PRICE_BRACKETS[PRICE_BRACKETS.length - 1].minValue;
  function maxPriceForStatValue(combinedStat) {
    if (combinedStat <= 0) return 0;
    let max = MIN_PRICE;
    for (const bracket of PRICE_BRACKETS) {
      if (combinedStat >= bracket.minValue) max = bracket.maxPrice;
    }
    return max;
  }
  function amountToNextBracket(combinedStat) {
    for (const bracket of PRICE_BRACKETS) {
      if (combinedStat < bracket.minValue) {
        return bracket.minValue - combinedStat;
      }
    }
    return null;
  }
  var maxPriceForPotency = maxPriceForStatValue;
  var potencyToNextBracket = amountToNextBracket;
  var CAP_POTENCY = CAP_VALUE;

  // src/pricing/potency.ts
  function combinedPotencyForType(hirelings, type) {
    let total = 0;
    for (const h of hirelings) {
      if (h.potionType === type) {
        const slot0 = h.card.potions[0];
        if (slot0) total += slot0.potency + h.permanentPotencyBonus;
      }
      if (h.potionType2 === type) {
        const slot1 = h.card.potions[1];
        if (slot1) total += slot1.potency + h.permanentPotencyBonus2;
      }
    }
    return total;
  }
  function combinedStockForType(hirelings, type) {
    let total = 0;
    for (const h of hirelings) {
      if (h.potionType === type) {
        const slot0 = h.card.potions[0];
        if (slot0) total += slot0.stock + h.permanentStockBonus;
      }
      if (h.potionType2 === type) {
        const slot1 = h.card.potions[1];
        if (slot1) total += slot1.stock + h.permanentStockBonus2;
      }
    }
    return total;
  }
  function combinedPotencyFromBoard(board, type) {
    return combinedPotencyForType(activeHirelings(board), type);
  }
  function combinedPotencyMap(board, activeTypes) {
    const hirelings = activeHirelings(board);
    const result = /* @__PURE__ */ new Map();
    for (const type of activeTypes) {
      result.set(type, combinedPotencyForType(hirelings, type));
    }
    return result;
  }
  function combinedStockMap(board, activeTypes) {
    const hirelings = activeHirelings(board);
    const result = /* @__PURE__ */ new Map();
    for (const type of activeTypes) {
      result.set(type, combinedStockForType(hirelings, type));
    }
    return result;
  }

  // src/pricing/panel.ts
  function defaultPriceMap(activeTypes) {
    const prices = /* @__PURE__ */ new Map();
    for (const type of activeTypes) prices.set(type, MIN_PRICE);
    return { prices };
  }
  function setPrice(prices, type, price, maxAllowed) {
    if (!prices.prices.has(type)) {
      throw new Error(`Potion type "${type}" is not in the price map.`);
    }
    if (!Number.isInteger(price)) {
      throw new Error(`Price must be an integer (got ${price}).`);
    }
    const clamped = Math.max(MIN_PRICE, Math.min(maxAllowed, price));
    const next = new Map(prices.prices);
    next.set(type, clamped);
    return { prices: next };
  }
  function priceFor(prices, type) {
    var _a;
    return (_a = prices.prices.get(type)) != null ? _a : MIN_PRICE;
  }
  function buildPricingPanel(activeTypes, board, prices) {
    const potencies = combinedPotencyMap(board, activeTypes);
    const stocks = combinedStockMap(board, activeTypes);
    return activeTypes.map((type) => {
      var _a, _b;
      const combinedPotency = (_a = potencies.get(type)) != null ? _a : 0;
      const combinedStock = (_b = stocks.get(type)) != null ? _b : 0;
      const tierValue = Math.max(combinedStock, combinedPotency);
      const currentMax = maxPriceForStatValue(tierValue);
      const stored = priceFor(prices, type);
      const effectivePrice = currentMax === 0 ? 0 : Math.max(MIN_PRICE, Math.min(currentMax, stored));
      let status;
      if (tierValue === 0) {
        status = { kind: "no-stock" };
      } else if (tierValue >= CAP_VALUE) {
        status = { kind: "at-cap" };
      } else {
        const limitingStat = combinedStock >= combinedPotency ? "stock" : "potency";
        status = {
          kind: "below-cap",
          amountToNextTier: amountToNextBracket(tierValue),
          limitingStat
        };
      }
      return {
        potionType: type,
        combinedPotency,
        combinedStock,
        tierValue,
        storedPrice: stored,
        effectivePrice,
        currentMax,
        status
      };
    });
  }
  function applyHaggle(basePrice, hireling) {
    const hasHaggle = hireling.card.keywords.some((k) => k.name === "Haggle");
    return hasHaggle ? basePrice + 3 : basePrice;
  }

  // src/pricing/stock.ts
  function unitsRange(stock) {
    if (stock <= 0) return { min: 0, max: 0 };
    if (stock <= 5) return { min: 1, max: 1 };
    if (stock <= 15) return { min: 1, max: 2 };
    if (stock <= 30) return { min: 2, max: 3 };
    return { min: 3, max: 4 };
  }
  function rollUnitsPerInteraction(stock, rng) {
    const { min, max } = unitsRange(stock);
    if (max === 0) return 0;
    const rolled = min + Math.floor(rng() * (max - min + 1));
    return Math.min(rolled, stock);
  }

  // src/customers/types.ts
  var AXES = Object.freeze([
    "focus",
    "type",
    "budget",
    "quality"
  ]);
  var AXIS_THRESHOLD = 100;
  var MIN_REPUTATION_STARS = 1;
  var MAX_REPUTATION_STARS = 5;

  // src/customers/state.ts
  function assertFinite(value, label) {
    if (!Number.isFinite(value)) {
      throw new Error(`${label} must be a finite number (got ${value}).`);
    }
  }
  function createCustomerState(customer) {
    if (!Number.isInteger(customer.reputationStars) || customer.reputationStars < MIN_REPUTATION_STARS || customer.reputationStars > MAX_REPUTATION_STARS) {
      throw new Error(
        `Customer reputationStars must be integer in ${MIN_REPUTATION_STARS}..${MAX_REPUTATION_STARS} (got ${customer.reputationStars}).`
      );
    }
    if (customer.axisPriority.length !== AXES.length) {
      throw new Error(
        `Customer axisPriority must list all ${AXES.length} axes.`
      );
    }
    if (new Set(customer.axisPriority).size !== AXES.length) {
      throw new Error("Customer axisPriority contains duplicates.");
    }
    assertFinite(customer.patienceSeconds, "Customer patienceSeconds");
    if (customer.patienceSeconds <= 0) {
      throw new Error("Customer patienceSeconds must be positive.");
    }
    const axes = {
      focus: { playerFill: 0, opponentFill: 0 },
      type: { playerFill: 0, opponentFill: 0 },
      budget: { playerFill: 0, opponentFill: 0 },
      quality: { playerFill: 0, opponentFill: 0 }
    };
    return {
      customer,
      axes,
      patienceRemaining: customer.patienceSeconds,
      resolvedFor: null,
      bewitchedByIds: []
    };
  }
  function setAxis(state, axis, bar) {
    return {
      ...state,
      axes: { ...state.axes, [axis]: bar }
    };
  }
  function clampToThreshold(fill) {
    return Math.max(0, Math.min(AXIS_THRESHOLD, fill));
  }
  function applyContribution(state, axis, side, amount) {
    if (state.resolvedFor !== null) return state;
    assertFinite(amount, "applyContribution amount");
    const current = state.axes[axis];
    const next = side === "player" ? { ...current, playerFill: clampToThreshold(current.playerFill + amount) } : {
      ...current,
      opponentFill: clampToThreshold(current.opponentFill + amount)
    };
    return setAxis(state, axis, next);
  }
  function tickPatience(state, seconds) {
    if (state.resolvedFor !== null) return state;
    assertFinite(seconds, "tickPatience seconds");
    if (seconds < 0) {
      throw new Error("tickPatience seconds must be non-negative.");
    }
    return {
      ...state,
      patienceRemaining: Math.max(0, state.patienceRemaining - seconds)
    };
  }
  function isExpired(state) {
    return state.patienceRemaining <= 0;
  }
  function axisLeader(state, axis) {
    const bar = state.axes[axis];
    if (bar.playerFill > bar.opponentFill) return "player";
    if (bar.opponentFill > bar.playerFill) return "opponent";
    return null;
  }
  function axesLedBy(state, side) {
    let count = 0;
    for (const axis of AXES) {
      if (axisLeader(state, axis) === side) count++;
    }
    return count;
  }
  var AXIS_PRIORITY_WEIGHTS = Object.freeze([
    4,
    3,
    2,
    1
  ]);
  function weightedLeadScore(state, side) {
    var _a;
    let score = 0;
    for (let i = 0; i < state.customer.axisPriority.length; i++) {
      const axis = state.customer.axisPriority[i];
      if (axisLeader(state, axis) === side) {
        score += (_a = AXIS_PRIORITY_WEIGHTS[i]) != null ? _a : 0;
      }
    }
    return score;
  }
  function determineWinner(state) {
    const playerScore = weightedLeadScore(state, "player");
    const opponentScore = weightedLeadScore(state, "opponent");
    if (playerScore > opponentScore) return "player";
    if (opponentScore > playerScore) return "opponent";
    for (const axis of state.customer.axisPriority) {
      const leader = axisLeader(state, axis);
      if (leader) return leader;
    }
    return null;
  }
  var EARLY_RESOLVE_MIN_DIFF = 5;
  function determineEarlyWinner(state) {
    if (state.resolvedFor !== null) return null;
    const playerScore = weightedLeadScore(state, "player");
    const opponentScore = weightedLeadScore(state, "opponent");
    const diff = playerScore - opponentScore;
    if (diff >= EARLY_RESOLVE_MIN_DIFF) return "player";
    if (-diff >= EARLY_RESOLVE_MIN_DIFF) return "opponent";
    return null;
  }
  function resolveCustomer(state) {
    if (state.resolvedFor !== null) return state;
    const winner = determineWinner(state);
    const resolution = winner != null ? winner : "no-sale";
    return { ...state, resolvedFor: resolution };
  }
  function isResolved(state) {
    return state.resolvedFor !== null;
  }
  function reputationReward(state) {
    return state.resolvedFor === "player" ? state.customer.reputationStars : 0;
  }

  // src/customers/contributions.ts
  var PASSIVE_RATES = Object.freeze({
    /** Focus contribution per unit of stock per second. */
    focusPerStock: 0.5,
    /** Quality contribution per unit of potency per second. */
    qualityPerPotency: 1,
    /**
     * Budget contribution per second when the hireling's price fits in the
     * customer's budget. Subtracted when over-budget.
     */
    budgetFitPerSecond: 2,
    budgetOverPerSecond: 1.5,
    /** Type contribution per second when the hireling sells the desired type. */
    typeMatchPerSecond: 4
  });
  function computePassiveContribution(hireling, panelPrice, customer) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let baseStock = 0;
    let potency = 0;
    let typeMatches = false;
    if (hireling.potionType === customer.desiredType) {
      baseStock = ((_b = (_a = hireling.card.potions[0]) == null ? void 0 : _a.stock) != null ? _b : 0) + hireling.permanentStockBonus;
      potency = ((_d = (_c = hireling.card.potions[0]) == null ? void 0 : _c.potency) != null ? _d : 0) + hireling.permanentPotencyBonus;
      typeMatches = true;
    } else if (hireling.potionType2 === customer.desiredType) {
      baseStock = ((_f = (_e = hireling.card.potions[1]) == null ? void 0 : _e.stock) != null ? _f : 0) + hireling.permanentStockBonus2;
      potency = ((_h = (_g = hireling.card.potions[1]) == null ? void 0 : _g.potency) != null ? _h : 0) + hireling.permanentPotencyBonus2;
      typeMatches = true;
    }
    return {
      focus: typeMatches ? baseStock * PASSIVE_RATES.focusPerStock : 0,
      type: typeMatches ? PASSIVE_RATES.typeMatchPerSecond : 0,
      budget: typeMatches && panelPrice <= customer.budget ? PASSIVE_RATES.budgetFitPerSecond : 0,
      quality: typeMatches && potency >= customer.qualityThreshold ? potency * PASSIVE_RATES.qualityPerPotency : 0
    };
  }
  function overBudgetPressure(hireling, panelPrice, customer) {
    const typeMatches = hireling.potionType === customer.desiredType || hireling.potionType2 === customer.desiredType;
    if (!typeMatches) return 0;
    return panelPrice > customer.budget ? PASSIVE_RATES.budgetOverPerSecond : 0;
  }
  function contributionToAxes(c) {
    return { focus: c.focus, type: c.type, budget: c.budget, quality: c.quality };
  }

  // src/action/weather.ts
  function tickWeather(weather, deltaSeconds) {
    if (!weather) return null;
    if (weather.remainingSeconds === null) return weather;
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error(
        `tickWeather deltaSeconds must be a non-negative finite number (got ${deltaSeconds}).`
      );
    }
    const next = weather.remainingSeconds - deltaSeconds;
    if (next <= 0) return null;
    return { ...weather, remainingSeconds: next };
  }

  // src/action/state.ts
  function firstCastDelay(castTime, rng) {
    switch (castTime.kind) {
      case "passive":
        return null;
      case "seconds":
        return castTime.value;
      case "random":
        return castTime.min + rng() * (castTime.max - castTime.min);
      case "decreasing":
        return castTime.start > 0 ? castTime.start : null;
    }
  }
  function nextCastDelay(castTime, castsSoFar, rng) {
    switch (castTime.kind) {
      case "passive":
        return null;
      case "seconds":
        return castTime.value;
      case "random":
        return castTime.min + rng() * (castTime.max - castTime.min);
      case "decreasing": {
        const next = castTime.start - castsSoFar * castTime.decrementPerCast;
        return next > 0 ? next : null;
      }
    }
  }
  function effectiveCastTime(inst, board) {
    const base = inst.card.castTime;
    switch (inst.card.id) {
      case "rush-order-cook": {
        if (base.kind !== "seconds") return base;
        const sugarAllies = activeHirelings(board).filter(
          (h) => h.id !== inst.id && h.card.kind === "hireling" && h.card.guild === "Sugar Guild"
        ).length;
        return { kind: "seconds", value: Math.max(1, base.value - sugarAllies) };
      }
      default:
        return base;
    }
  }
  function freshHirelingState(inst, board, rng) {
    return {
      instanceId: inst.id,
      castsSoFar: 0,
      nextCastIn: firstCastDelay(effectiveCastTime(inst, board), rng),
      temporaryStock: 0,
      permanentStockGainedThisRound: 0,
      permanentPotencyGainedThisRound: 0,
      unitsSoldThisRound: 0,
      temporaryStock2: 0,
      permanentStockGainedThisRound2: 0,
      permanentPotencyGainedThisRound2: 0,
      unitsSoldThisRound2: 0,
      bewitchLevel: 1
    };
  }
  function effectiveStock(inst, hs, slot = 0) {
    var _a, _b;
    const base = (_b = (_a = inst.card.potions[slot]) == null ? void 0 : _a.stock) != null ? _b : 0;
    if (slot === 1) {
      return base + inst.permanentStockBonus2 + hs.permanentStockGainedThisRound2 + hs.temporaryStock2 - hs.unitsSoldThisRound2;
    }
    return base + inst.permanentStockBonus + hs.permanentStockGainedThisRound + hs.temporaryStock - hs.unitsSoldThisRound;
  }
  function effectivePotency(inst, hs, slot = 0) {
    var _a, _b;
    const base = (_b = (_a = inst.card.potions[slot]) == null ? void 0 : _a.potency) != null ? _b : 0;
    if (slot === 1) {
      return base + inst.permanentPotencyBonus2 + hs.permanentPotencyGainedThisRound2;
    }
    return base + inst.permanentPotencyBonus + hs.permanentPotencyGainedThisRound;
  }
  function hasKeyword(inst, name) {
    return inst.card.keywords.some((k) => k.name === name);
  }
  function knockoffCount(inst) {
    var _a, _b;
    return (_b = (_a = inst.card.keywords.find((k) => k.name === "Knockoff")) == null ? void 0 : _a.count) != null ? _b : 0;
  }
  function initializeActionState(board, prices, activePotionTypes, rng, startingGold = 0, startingReputation = 0) {
    const states = /* @__PURE__ */ new Map();
    for (const inst of activeHirelings(board)) {
      states.set(inst.id, freshHirelingState(inst, board, rng));
    }
    let state = {
      board,
      prices,
      activePotionTypes,
      elapsedSeconds: 0,
      hirelingStates: states,
      customers: [],
      gold: startingGold,
      reputation: startingReputation,
      weather: null,
      opponent: null,
      log: []
    };
    for (const inst of activeHirelings(board)) {
      state = applyRoundStartAbility(state, inst, 0);
    }
    return state;
  }
  function setOpponent(state, snapshot) {
    return { ...state, opponent: snapshot };
  }
  function setWeather(state, weather) {
    return {
      ...state,
      weather,
      log: [
        ...state.log,
        {
          kind: "weather-started",
          weatherId: weather.id,
          atSeconds: state.elapsedSeconds
        }
      ]
    };
  }
  function addCustomer(state, customer) {
    const cs = createCustomerState(customer);
    return {
      ...state,
      customers: [...state.customers, cs],
      log: [
        ...state.log,
        {
          kind: "customer-arrived",
          customerId: customer.id,
          atSeconds: state.elapsedSeconds
        }
      ]
    };
  }
  function quickcraftCount(inst) {
    var _a;
    const k = inst.card.keywords.find((x) => x.name === "Quickcraft");
    return (_a = k == null ? void 0 : k.count) != null ? _a : 0;
  }
  function findInstance(board, instanceId) {
    return activeHirelings(board).find((h) => h.id === instanceId);
  }
  function findLastAbilityBuff(log) {
    for (let i = log.length - 1; i >= 0; i--) {
      const e = log[i];
      if (e.kind === "ability-buff") return e;
    }
    return null;
  }
  function buffHireling(state, casterId, targetId, stockGained, potencyGained, atSeconds, reentrant = false) {
    if (stockGained === 0 && potencyGained === 0) return state;
    const hs = state.hirelingStates.get(targetId);
    if (!hs) return state;
    const target = findInstance(state.board, targetId);
    if ((target == null ? void 0 : target.card.id) === "dusty-broom") return state;
    const next = {
      ...hs,
      permanentStockGainedThisRound: hs.permanentStockGainedThisRound + stockGained,
      permanentPotencyGainedThisRound: hs.permanentPotencyGainedThisRound + potencyGained
    };
    const states = new Map(state.hirelingStates);
    states.set(targetId, next);
    const log = [
      ...state.log,
      {
        kind: "ability-buff",
        casterId,
        targetId,
        stockGained,
        potencyGained,
        atSeconds
      }
    ];
    let working = { ...state, hirelingStates: states, log };
    if (!reentrant && target) {
      for (const ally of activeHirelings(working.board)) {
        if (ally.id === targetId) continue;
        working = applyOnPermanentBuffEvent(
          working,
          ally,
          { casterId, targetId, stockGained, potencyGained, atSeconds },
          atSeconds
        );
      }
    }
    return working;
  }
  function applyOnPermanentBuffEvent(state, reactor, event, atSeconds) {
    switch (reactor.card.id) {
      case "court-jester": {
        let working = state;
        if (event.stockGained > 0) {
          working = addTemporaryStock(working, reactor.id, 1);
        }
        if (event.potencyGained > 0) {
          const hs = working.hirelingStates.get(reactor.id);
          if (hs) {
            const states = new Map(working.hirelingStates);
            states.set(reactor.id, {
              ...hs,
              permanentPotencyGainedThisRound: hs.permanentPotencyGainedThisRound + 1
            });
            working = { ...working, hirelingStates: states };
          }
        }
        return working;
      }
      case "the-candy-architect": {
        if (event.potencyGained <= 0) return state;
        const target = findInstance(state.board, event.targetId);
        if (!target || target.card.kind !== "hireling" || target.card.guild !== "Sugar Guild") return state;
        return buffHireling(state, reactor.id, reactor.id, 2, 0, atSeconds, true);
      }
      default:
        return state;
    }
  }
  function applyPostSaleAbility(state, hireling, haggled, atSeconds) {
    switch (hireling.card.id) {
      case "jumping-jack":
        return buffHireling(state, hireling.id, hireling.id, 1, 1, atSeconds);
      case "confectioner":
        return buffActiveAllies(
          state,
          hireling,
          0,
          1,
          atSeconds,
          (h) => h.card.kind === "hireling" && h.card.guild === "Sugar Guild"
        );
      case "street-rat":
        if (!haggled) return state;
        return buffHireling(state, hireling.id, hireling.id, 2, 0, atSeconds);
      case "cookie-seller": {
        const saleCount = state.log.filter(
          (e) => e.kind === "sale" && e.instanceId === hireling.id
        ).length;
        if (saleCount !== 1) return state;
        return { ...state, gold: state.gold + 1 };
      }
      case "almost-a-knight":
        if (!haggled) return state;
        return addTemporaryStock(state, hireling.id, 2);
      case "pickpocket-pixie": {
        const playerThieves = state.board.slots.filter(
          (s) => s && s.card.kind === "hireling" && s.card.guild === "Thieves Guild"
        ).length;
        const oppThieves = state.opponent ? state.opponent.board.slots.filter(
          (s) => s && s.card.kind === "hireling" && s.card.guild === "Thieves Guild"
        ).length : 0;
        const total = playerThieves + oppThieves;
        if (total <= 0) return state;
        return addTemporaryStock(state, hireling.id, total);
      }
      default:
        return state;
    }
  }
  function addTemporaryStock(state, targetId, amount) {
    if (amount <= 0) return state;
    const hs = state.hirelingStates.get(targetId);
    if (!hs) return state;
    const target = findInstance(state.board, targetId);
    if ((target == null ? void 0 : target.card.id) === "dusty-broom") return state;
    const states = new Map(state.hirelingStates);
    states.set(targetId, { ...hs, temporaryStock: hs.temporaryStock + amount });
    return { ...state, hirelingStates: states };
  }
  function applyOnAllySaleAbility(state, reactor, seller, atSeconds) {
    if (reactor.id === seller.id) return state;
    switch (reactor.card.id) {
      case "gingerbread-king":
        return buffHireling(state, seller.id, reactor.id, 0, 2, atSeconds);
      case "the-page":
        return addTemporaryStock(state, reactor.id, 1);
      default:
        return state;
    }
  }
  function applyOnAllyCastAbility(state, reactor, caster, atSeconds) {
    if (reactor.id === caster.id) return state;
    switch (reactor.card.id) {
      case "apprentice-baker":
        if (quickcraftCount(caster) <= 0) return state;
        return addTemporaryStock(state, reactor.id, 1);
      default:
        return state;
    }
  }
  function applyOnNoPlayerSaleAbility(state, reactor, atSeconds) {
    switch (reactor.card.id) {
      case "nimble-ned": {
        const otherThieves = activeHirelings(state.board).filter(
          (h) => h.id !== reactor.id && h.card.kind === "hireling" && h.card.guild === "Thieves Guild"
        ).length;
        if (otherThieves < 2) return state;
        return { ...state, gold: state.gold + 1 };
      }
      default:
        return state;
    }
  }
  function applyRoundStartAbility(state, inst, atSeconds) {
    switch (inst.card.id) {
      case "goblin-king": {
        const robbin = activeHirelings(state.board).find(
          (h) => h.card.id === "robbin-goblin"
        );
        if (!robbin) return state;
        let working = buffHireling(state, inst.id, inst.id, 3, 1, atSeconds);
        working = buffHireling(working, inst.id, robbin.id, 3, 1, atSeconds);
        return working;
      }
      default:
        return state;
    }
  }
  function applyEndOfRoundAbility(state, inst, atSeconds) {
    const hs = state.hirelingStates.get(inst.id);
    if (!hs) return state;
    switch (inst.card.id) {
      case "burnt-batch":
        if (hs.unitsSoldThisRound === 0) {
          return buffHireling(state, inst.id, inst.id, 0, 6, atSeconds);
        }
        return state;
      case "glazier": {
        const generated = quickcraftCount(inst) * hs.castsSoFar;
        if (generated > 10) {
          return buffHireling(state, inst.id, inst.id, 0, 3, atSeconds);
        }
        return state;
      }
      case "pantry-stocker":
        return buffHireling(state, inst.id, inst.id, 1, 0, atSeconds);
      case "royal-treasurer": {
        let soldNobles = 0;
        for (const ally of activeHirelings(state.board)) {
          if (ally.id === inst.id) continue;
          if (ally.card.kind !== "hireling") continue;
          if (ally.card.guild !== "Nobles Guild") continue;
          const aHs = state.hirelingStates.get(ally.id);
          if (aHs && aHs.unitsSoldThisRound > 0) soldNobles++;
        }
        if (soldNobles <= 0) return state;
        return { ...state, gold: state.gold + soldNobles };
      }
      default:
        return state;
    }
  }
  var BEWITCH_FOCUS_BURST = 40;
  var MAX_BEWITCH_LEVEL = 2;
  var SABOTAGE_DEFAULT_SECONDS = 1;
  function sabotageSecondsFor(inst) {
    var _a;
    const k = inst.card.keywords.find((x) => x.name === "Sabotage");
    if (!k) return 0;
    return (_a = k.count) != null ? _a : SABOTAGE_DEFAULT_SECONDS;
  }
  function pickSabotageTarget(state, caster, rng) {
    if (!state.opponent) return null;
    const candidates = activeHirelings(state.opponent.board);
    if (candidates.length === 0) return null;
    switch (caster.card.id) {
      case "sticky-fingers": {
        let best = null;
        let bestSeconds = Infinity;
        for (const h of candidates) {
          const seconds = castTimeForTargeting(h);
          if (seconds < bestSeconds) {
            best = h;
            bestSeconds = seconds;
          }
        }
        return best;
      }
      default:
        return candidates[Math.floor(rng() * candidates.length)];
    }
  }
  function pickHighestPotencyOpponent(state) {
    var _a, _b;
    if (!state.opponent) return null;
    const candidates = activeHirelings(state.opponent.board);
    if (candidates.length === 0) return null;
    let best = null;
    let bestPot = -Infinity;
    for (const h of candidates) {
      const pot = ((_b = (_a = h.card.potions[0]) == null ? void 0 : _a.potency) != null ? _b : 0) + h.permanentPotencyBonus;
      if (pot > bestPot) {
        best = h;
        bestPot = pot;
      }
    }
    return best;
  }
  function castTimeForTargeting(inst) {
    const ct = inst.card.castTime;
    switch (ct.kind) {
      case "passive":
        return Infinity;
      case "seconds":
        return ct.value;
      case "decreasing":
        return ct.start;
      case "random":
        return ct.max;
    }
  }
  function applySabotage(state, caster, atSeconds, rng) {
    const seconds = sabotageSecondsFor(caster);
    if (seconds <= 0) return state;
    const target = pickSabotageTarget(state, caster, rng);
    if (!target) return state;
    let working = {
      ...state,
      log: [
        ...state.log,
        {
          kind: "sabotage",
          casterId: caster.id,
          targetInstanceId: target.id,
          secondsAdded: seconds,
          atSeconds
        }
      ]
    };
    for (const ally of activeHirelings(working.board)) {
      if (ally.id === caster.id) continue;
      working = applyOnAllySabotageAbility(working, ally, caster, atSeconds);
    }
    working = applyOnOwnSabotageSuccess(working, caster, atSeconds);
    return working;
  }
  function applyOnAllySabotageAbility(state, reactor, saboteur, atSeconds) {
    switch (reactor.card.id) {
      case "snitch-witch": {
        const alreadyTriggered = state.log.some(
          (e) => e.kind === "ability-buff" && e.casterId === reactor.id && e.targetId === reactor.id && e.stockGained === 1 && e.potencyGained === 0
        );
        if (alreadyTriggered) return state;
        return buffHireling(state, reactor.id, reactor.id, 1, 0, atSeconds);
      }
      default:
        return state;
    }
  }
  function applyOnOwnSabotageSuccess(state, caster, atSeconds) {
    switch (caster.card.id) {
      case "the-saboteur": {
        const states = new Map(state.hirelingStates);
        let dirty = false;
        for (const ally of activeHirelings(state.board)) {
          if (ally.card.guild !== "Thieves Guild") continue;
          const hs = state.hirelingStates.get(ally.id);
          if (!hs || hs.nextCastIn === null) continue;
          states.set(ally.id, {
            ...hs,
            nextCastIn: Math.max(0.1, hs.nextCastIn - 0.5)
          });
          dirty = true;
        }
        return dirty ? { ...state, hirelingStates: states } : state;
      }
      default:
        return state;
    }
  }
  function pickBewitchTargets(state, caster, level) {
    const eligible = state.customers.filter(
      (cs) => cs.resolvedFor === null && !cs.bewitchedByIds.includes(caster.id)
    );
    switch (caster.card.id) {
      case "the-champion-knight":
      case "the-prince": {
        let best = null;
        for (const cs of eligible) {
          if (!best || cs.customer.reputationStars > best.customer.reputationStars) {
            best = cs;
          }
        }
        return best ? [best] : [];
      }
      default:
        return eligible.slice(0, level);
    }
  }
  function applyBewitch(state, caster, atSeconds, rng) {
    var _a;
    const casterHs = state.hirelingStates.get(caster.id);
    if (!casterHs) return state;
    const level = Math.min(MAX_BEWITCH_LEVEL, (_a = casterHs.bewitchLevel) != null ? _a : 1);
    const targets = pickBewitchTargets(state, caster, level);
    if (targets.length === 0) return state;
    const targetIdSet = new Set(targets.map((cs) => cs.customer.id));
    const customers = state.customers.map((cs) => {
      if (!targetIdSet.has(cs.customer.id)) return cs;
      const focus = cs.axes.focus;
      const nextFocus = {
        playerFill: Math.min(
          AXIS_THRESHOLD,
          focus.playerFill + BEWITCH_FOCUS_BURST
        ),
        opponentFill: focus.opponentFill
      };
      return {
        ...cs,
        axes: { ...cs.axes, focus: nextFocus },
        bewitchedByIds: [...cs.bewitchedByIds, caster.id]
      };
    });
    const log = [
      ...state.log,
      {
        kind: "bewitch",
        casterId: caster.id,
        customerIds: targets.map((cs) => cs.customer.id),
        focusBurst: BEWITCH_FOCUS_BURST,
        atSeconds
      }
    ];
    let working = { ...state, customers, log };
    working = applyOnOwnBewitchSuccess(working, caster, targets, atSeconds, rng);
    return working;
  }
  function applyOnOwnBewitchSuccess(state, caster, targets, atSeconds, rng) {
    switch (caster.card.id) {
      case "ladys-maid": {
        const allies = activeHirelings(state.board).filter(
          (h) => h.id !== caster.id && h.card.id !== "dusty-broom"
        );
        if (allies.length === 0) return state;
        const ally = allies[Math.floor(rng() * allies.length)];
        return buffHireling(state, caster.id, ally.id, 0, 1, atSeconds);
      }
      case "knight-errant": {
        const high = targets.find((cs) => cs.customer.reputationStars >= 3);
        if (!high) return state;
        return buffHireling(state, caster.id, caster.id, 0, 3, atSeconds);
      }
      case "part-time-potioneer":
        return buffHireling(state, caster.id, caster.id, 0, 2, atSeconds);
      case "the-squire": {
        const knightOnBoard = activeHirelings(state.board).some(
          (h) => h.card.id === "knight-errant"
        );
        if (!knightOnBoard) return state;
        const high = targets.find((cs) => cs.customer.reputationStars >= 3);
        if (!high) return state;
        return buffHireling(state, caster.id, caster.id, 0, 3, atSeconds);
      }
      default:
        return state;
    }
  }
  function applyOnBewitchedCustomerSale(state, bewitcher, seller, goldFromThisSale, atSeconds) {
    switch (bewitcher.card.id) {
      case "the-champion-knight":
        return buffActiveAllies(
          state,
          bewitcher,
          0,
          2,
          atSeconds,
          (h) => h.card.kind === "hireling" && h.card.guild === "Nobles Guild"
        );
      case "the-prince": {
        let working = buffHireling(state, bewitcher.id, bewitcher.id, 0, 3, atSeconds);
        working = buffActiveAllies(
          working,
          bewitcher,
          0,
          1,
          atSeconds,
          (h) => h.card.kind === "hireling" && h.card.guild === "Nobles Guild"
        );
        return working;
      }
      case "masked-minstrel": {
        if (seller.id !== bewitcher.id) return state;
        const reversed = { ...state, gold: state.gold - goldFromThisSale };
        return buffHireling(reversed, bewitcher.id, bewitcher.id, 3, 0, atSeconds);
      }
      default:
        return state;
    }
  }
  function applyPostCastAbility(state, caster, atSeconds, rng) {
    switch (caster.card.id) {
      case "sugar-sprinkler":
        return buffActiveAdjacent(state, caster, 0, 1, atSeconds);
      case "oven-master":
        return buffActiveAllies(state, caster, 0, 2, atSeconds);
      case "lord-chamberlain":
        return buffActiveAllies(
          state,
          caster,
          1,
          1,
          atSeconds,
          (h) => h.card.kind === "hireling" && h.card.guild === "Nobles Guild"
        );
      case "snatchling":
        return buffHireling(
          { ...state, reputation: state.reputation - 1 },
          caster.id,
          caster.id,
          4,
          0,
          atSeconds
        );
      case "fence-master":
        return buffActiveAllies(
          { ...state, reputation: state.reputation - 1 },
          caster,
          1,
          0,
          atSeconds,
          (h) => h.card.kind === "hireling" && h.card.guild === "Thieves Guild"
        );
      case "ogreachiever":
        return buffActiveAllies(
          state,
          caster,
          0,
          1,
          atSeconds,
          (h) => h.card.kind === "hireling" && quickcraftCount(h) === 0
        );
      case "the-duchess":
        return applyDuchessBuffs(state, caster, atSeconds);
      case "sticky-fingers":
        return addTemporaryStock(state, caster.id, 2);
      case "the-court-scribe": {
        const last = findLastAbilityBuff(state.log);
        if (!last) return state;
        const stockBoost = last.stockGained > 0 ? 1 : 0;
        const potencyBoost = last.potencyGained > 0 ? 1 : 0;
        if (stockBoost === 0 && potencyBoost === 0) return state;
        return buffHireling(state, caster.id, last.targetId, stockBoost, potencyBoost, atSeconds, true);
      }
      case "the-grand-vizier": {
        const last = findLastAbilityBuff(state.log);
        if (!last) return state;
        return buffHireling(state, caster.id, caster.id, last.stockGained, last.potencyGained, atSeconds, true);
      }
      case "royal-advisor": {
        const nobleAllies = activeHirelings(state.board).filter(
          (h) => h.id !== caster.id && h.card.guild === "Nobles Guild"
        );
        if (nobleAllies.length === 0) return state;
        const target = nobleAllies[Math.floor(rng() * nobleAllies.length)];
        return buffHireling(state, caster.id, target.id, 2, 2, atSeconds);
      }
      case "prince-of-thieves": {
        let working = { ...state, reputation: state.reputation - 2 };
        const target = pickHighestPotencyOpponent(working);
        if (!target) return working;
        const log = [
          ...working.log,
          {
            kind: "sabotage",
            casterId: caster.id,
            targetInstanceId: target.id,
            secondsAdded: 3,
            atSeconds
          }
        ];
        return { ...working, log };
      }
      case "the-herald": {
        let working = state;
        for (const ally of activeHirelings(state.board)) {
          if (ally.id === caster.id) continue;
          if (ally.card.kind !== "hireling") continue;
          if (ally.card.guild !== "Nobles Guild") continue;
          working = addTemporaryStock(working, ally.id, 1);
        }
        return working;
      }
      case "grumblegut-dragon":
        return applyGrumbleguDragonCast(state, caster, atSeconds);
      case "the-queen": {
        const customers = state.customers.map((cs) => {
          if (cs.resolvedFor !== null) return cs;
          return {
            ...cs,
            customer: {
              ...cs.customer,
              reputationStars: cs.customer.reputationStars + 1
            }
          };
        });
        return { ...state, customers };
      }
      default:
        return state;
    }
  }
  function applyGrumbleguDragonCast(state, caster, atSeconds) {
    const casterSlot = state.board.slots.findIndex((s) => (s == null ? void 0 : s.id) === caster.id);
    if (casterSlot === -1) return state;
    let working = state;
    let totalEaten = 0;
    for (const neighborSlot of [casterSlot - 1, casterSlot + 1]) {
      if (neighborSlot < 0 || neighborSlot >= state.board.slots.length) continue;
      const neighbor = state.board.slots[neighborSlot];
      if (!neighbor) continue;
      if (!working.hirelingStates.has(neighbor.id)) continue;
      if (neighbor.card.id === "dusty-broom") continue;
      const hs = working.hirelingStates.get(neighbor.id);
      const eaten = Math.min(2, Math.max(0, effectivePotency(neighbor, hs)));
      if (eaten === 0) continue;
      working = buffHireling(working, caster.id, neighbor.id, 0, -eaten, atSeconds);
      totalEaten += eaten;
    }
    if (totalEaten > 0) {
      working = buffHireling(working, caster.id, caster.id, totalEaten, 0, atSeconds);
    }
    return working;
  }
  function applyDuchessBuffs(state, caster, atSeconds) {
    const casterSlot = state.board.slots.findIndex((s) => (s == null ? void 0 : s.id) === caster.id);
    if (casterSlot === -1) return state;
    let working = state;
    let leftNoble = false;
    let rightNoble = false;
    for (let i = 0; i < state.board.slots.length; i++) {
      const h = state.board.slots[i];
      if (!h || h.id === caster.id) continue;
      if (h.card.kind !== "hireling" || h.card.guild !== "Nobles Guild") continue;
      if (!working.hirelingStates.has(h.id)) continue;
      if (i < casterSlot) {
        working = buffHireling(working, caster.id, h.id, 1, 0, atSeconds);
        leftNoble = true;
      } else if (i > casterSlot) {
        working = buffHireling(working, caster.id, h.id, 0, 1, atSeconds);
        rightNoble = true;
      }
    }
    if (leftNoble && rightNoble) {
      working = buffHireling(working, caster.id, caster.id, 1, 1, atSeconds);
    }
    return working;
  }
  function buffActiveAdjacent(state, caster, stock, potency, atSeconds) {
    const casterSlot = state.board.slots.findIndex((s) => (s == null ? void 0 : s.id) === caster.id);
    if (casterSlot === -1) return state;
    let working = state;
    for (const neighborSlot of [casterSlot - 1, casterSlot + 1]) {
      if (neighborSlot < 0 || neighborSlot >= state.board.slots.length) continue;
      const neighbor = state.board.slots[neighborSlot];
      if (!neighbor) continue;
      working = buffHireling(
        working,
        caster.id,
        neighbor.id,
        stock,
        potency,
        atSeconds
      );
    }
    return working;
  }
  function buffActiveAllies(state, caster, stock, potency, atSeconds, filter) {
    let working = state;
    for (const h of activeHirelings(state.board)) {
      if (h.id === caster.id) continue;
      if (filter && !filter(h)) continue;
      working = buffHireling(working, caster.id, h.id, stock, potency, atSeconds);
    }
    return working;
  }
  function fireCast(state, instanceId, atSeconds, rng) {
    const prev = state.hirelingStates.get(instanceId);
    if (!prev) return state;
    const inst = findInstance(state.board, instanceId);
    if (!inst) return state;
    const castNumber = prev.castsSoFar + 1;
    const log = [
      ...state.log,
      {
        kind: "cast",
        instanceId,
        atSeconds,
        castNumber
      }
    ];
    let temporaryStock = prev.temporaryStock;
    const qc = quickcraftCount(inst);
    if (qc > 0) {
      temporaryStock += qc;
      log.push({
        kind: "quickcraft",
        instanceId,
        atSeconds,
        stockAdded: qc,
        temporaryStockAfter: temporaryStock
      });
    }
    const nextDelay = nextCastDelay(
      effectiveCastTime(inst, state.board),
      castNumber,
      rng
    );
    if (nextDelay === null) {
      log.push({
        kind: "stopped",
        instanceId,
        atSeconds,
        reason: "decreasing-zero"
      });
    }
    const nextHireling = {
      ...prev,
      castsSoFar: castNumber,
      nextCastIn: nextDelay,
      temporaryStock
    };
    const hirelingStates = new Map(state.hirelingStates);
    hirelingStates.set(instanceId, nextHireling);
    let withCasterState = {
      ...state,
      hirelingStates,
      log
    };
    withCasterState = applyPostCastAbility(withCasterState, inst, atSeconds, rng);
    if (hasKeyword(inst, "Bewitch")) {
      withCasterState = applyBewitch(withCasterState, inst, atSeconds, rng);
    }
    if (hasKeyword(inst, "Sabotage")) {
      withCasterState = applySabotage(withCasterState, inst, atSeconds, rng);
    }
    for (const ally of activeHirelings(withCasterState.board)) {
      if (ally.id === inst.id) continue;
      withCasterState = applyOnAllyCastAbility(
        withCasterState,
        ally,
        inst,
        atSeconds
      );
    }
    return withCasterState;
  }
  function finalizeRound(state) {
    if (state.customers.every((c) => c.resolvedFor !== null)) return state;
    const panel = buildPricingPanel(
      state.activePotionTypes,
      state.board,
      state.prices
    );
    const priceByType = new Map(
      panel.map((e) => [e.potionType, e.effectivePrice])
    );
    let working = state;
    const resolvedCustomers = [];
    for (const cs of state.customers) {
      if (cs.resolvedFor !== null) {
        resolvedCustomers.push(cs);
        continue;
      }
      let next = resolveCustomer(cs);
      if (next.resolvedFor === "player") {
        const seller = pickSalesHireling(working, next.customer.desiredType);
        if (!seller) {
          next = { ...next, resolvedFor: "no-sale" };
        }
      }
      working = {
        ...working,
        log: [
          ...working.log,
          {
            kind: "customer-resolved",
            customerId: next.customer.id,
            atSeconds: state.elapsedSeconds,
            resolution: next.resolvedFor
          }
        ]
      };
      if (next.resolvedFor === "player") {
        working = executeSale(working, next, priceByType, deterministicMinRng);
      } else {
        for (const ally of activeHirelings(working.board)) {
          working = applyOnNoPlayerSaleAbility(working, ally, state.elapsedSeconds);
        }
      }
      resolvedCustomers.push(next);
    }
    return { ...working, customers: resolvedCustomers };
  }
  function applyEndOfRoundHooks(state) {
    let working = state;
    for (const inst of activeHirelings(working.board)) {
      working = applyEndOfRoundAbility(working, inst, working.elapsedSeconds);
    }
    return working;
  }
  var deterministicMinRng = () => 0;
  function tick(state, deltaSeconds, rng) {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new Error(
        `tick deltaSeconds must be a non-negative finite number (got ${deltaSeconds}).`
      );
    }
    if (deltaSeconds === 0) return state;
    let working = {
      ...state,
      elapsedSeconds: state.elapsedSeconds + deltaSeconds
    };
    for (const [instanceId, hs] of state.hirelingStates) {
      if (hs.nextCastIn === null) continue;
      let remainingDt = deltaSeconds;
      let timeConsumed = 0;
      let currentTimer = hs.nextCastIn;
      while (currentTimer !== null && currentTimer <= remainingDt) {
        const fireAt = state.elapsedSeconds + timeConsumed + currentTimer;
        remainingDt -= currentTimer;
        timeConsumed += currentTimer;
        working = fireCast(working, instanceId, fireAt, rng);
        currentTimer = working.hirelingStates.get(instanceId).nextCastIn;
      }
      if (currentTimer !== null) {
        const states = new Map(working.hirelingStates);
        states.set(instanceId, {
          ...working.hirelingStates.get(instanceId),
          nextCastIn: currentTimer - remainingDt
        });
        working = { ...working, hirelingStates: states };
      }
    }
    working = advanceCustomers(working, deltaSeconds, rng);
    if (working.weather) {
      const nextWeather = tickWeather(working.weather, deltaSeconds);
      if (nextWeather !== working.weather) {
        const log = [...working.log];
        if (nextWeather === null) {
          log.push({
            kind: "weather-cleared",
            weatherId: working.weather.id,
            atSeconds: working.elapsedSeconds
          });
        }
        working = { ...working, weather: nextWeather, log };
      }
    }
    return working;
  }
  function advanceCustomers(state, deltaSeconds, rng) {
    var _a, _b;
    if (state.customers.length === 0) return state;
    const panel = buildPricingPanel(
      state.activePotionTypes,
      state.board,
      state.prices
    );
    const priceByType = new Map(panel.map((e) => [e.potionType, e.effectivePrice]));
    const hirelings = activeHirelings(state.board);
    const oppHirelings = state.opponent ? activeHirelings(state.opponent.board) : [];
    const oppPriceByType = state.opponent ? new Map(
      buildPricingPanel(
        state.opponent.activePotionTypes,
        state.opponent.board,
        state.opponent.prices
      ).map((e) => [e.potionType, e.effectivePrice])
    ) : /* @__PURE__ */ new Map();
    const customersAfter = [];
    let working = state;
    for (const cs of state.customers) {
      if (isResolved(cs)) {
        customersAfter.push(cs);
        continue;
      }
      let next = cs;
      const activeDt = Math.min(deltaSeconds, next.patienceRemaining);
      for (const h of hirelings) {
        const price = (_a = h.potionType && priceByType.get(h.potionType)) != null ? _a : MIN_PRICE;
        const contrib = computePassiveContribution(h, price, next.customer);
        for (const axis of AXES) {
          const amount = contrib[axis] * activeDt;
          if (amount > 0) {
            next = applyContribution(next, axis, "player", amount);
          }
        }
      }
      for (const h of oppHirelings) {
        const price = (_b = h.potionType && oppPriceByType.get(h.potionType)) != null ? _b : MIN_PRICE;
        const contrib = computePassiveContribution(h, price, next.customer);
        for (const axis of AXES) {
          const amount = contrib[axis] * activeDt;
          if (amount > 0) {
            next = applyContribution(next, axis, "opponent", amount);
          }
        }
      }
      next = tickPatience(next, deltaSeconds);
      if (next.resolvedFor === null && !isExpired(next)) {
        const earlyWinner = determineEarlyWinner(next);
        if (earlyWinner === "player") {
          const seller = pickSalesHireling(working, next.customer.desiredType);
          if (seller) next = { ...next, resolvedFor: "player" };
        } else if (earlyWinner === "opponent") {
          next = { ...next, resolvedFor: "opponent" };
        }
      }
      if (isExpired(next) || next.resolvedFor !== null) {
        if (next.resolvedFor === null) next = resolveCustomer(next);
        if (next.resolvedFor === "player") {
          const seller = pickSalesHireling(working, next.customer.desiredType);
          if (!seller) {
            next = { ...next, resolvedFor: "no-sale" };
          }
        }
        working = {
          ...working,
          log: [
            ...working.log,
            {
              kind: "customer-resolved",
              customerId: next.customer.id,
              atSeconds: state.elapsedSeconds,
              resolution: next.resolvedFor
            }
          ]
        };
        if (next.resolvedFor === "player") {
          working = executeSale(working, next, priceByType, rng);
        } else {
          for (const ally of activeHirelings(working.board)) {
            working = applyOnNoPlayerSaleAbility(working, ally, state.elapsedSeconds);
          }
        }
      }
      customersAfter.push(next);
    }
    return { ...working, customers: customersAfter };
  }
  function pickSalesHirelingWithSlot(state, desiredType) {
    let best = null;
    let bestPotency = -1;
    for (const h of activeHirelings(state.board)) {
      const hs = state.hirelingStates.get(h.id);
      if (!hs) continue;
      for (const slot of [0, 1]) {
        const matches = slot === 0 ? h.potionType === desiredType : h.potionType2 === desiredType;
        if (!matches) continue;
        if (effectiveStock(h, hs, slot) <= 0) continue;
        const pot = effectivePotency(h, hs, slot);
        if (pot > bestPotency) {
          best = { hireling: h, slot };
          bestPotency = pot;
        }
      }
    }
    return best;
  }
  function pickSalesHireling(state, desiredType) {
    var _a, _b;
    return (_b = (_a = pickSalesHirelingWithSlot(state, desiredType)) == null ? void 0 : _a.hireling) != null ? _b : null;
  }
  function executeSale(state, customerState, priceByType, rng) {
    var _a, _b;
    const picked = pickSalesHirelingWithSlot(state, customerState.customer.desiredType);
    if (!picked) return state;
    const hireling = picked.hireling;
    const slot = picked.slot;
    const hs = state.hirelingStates.get(hireling.id);
    const available = effectiveStock(hireling, hs, slot);
    const desired = (_a = customerState.customer.desiredUnits) != null ? _a : 1;
    const rolled = rollUnitsPerInteraction(available, rng);
    const units = Math.min(available, Math.max(desired, rolled));
    if (units <= 0) return state;
    const slotPotionType = slot === 0 ? hireling.potionType : hireling.potionType2;
    const basePrice = (_b = priceByType.get(slotPotionType)) != null ? _b : MIN_PRICE;
    const haggled = hasKeyword(hireling, "Haggle");
    const pricePerUnit = applyHaggle(basePrice, hireling);
    const goldEarned = units * pricePerUnit;
    const confessorOnBoard = activeHirelings(state.board).some(
      (h) => h.card.id === "crooked-confessor"
    );
    const haggleRepPenalty = haggled && !confessorOnBoard ? 1 : 0;
    const reputationDelta = customerState.customer.reputationStars - haggleRepPenalty;
    const log = [
      ...state.log,
      {
        kind: "sale",
        customerId: customerState.customer.id,
        instanceId: hireling.id,
        unitsSold: units,
        pricePerUnit,
        goldEarned,
        reputationDelta,
        haggled,
        atSeconds: state.elapsedSeconds
      }
    ];
    let nextHs = slot === 0 ? { ...hs, unitsSoldThisRound: hs.unitsSoldThisRound + units } : { ...hs, unitsSoldThisRound2: hs.unitsSoldThisRound2 + units };
    const knockoff = knockoffCount(hireling);
    if (knockoff > 0 && effectivePotency(hireling, hs, slot) < 10) {
      nextHs = slot === 0 ? { ...nextHs, permanentStockGainedThisRound: nextHs.permanentStockGainedThisRound + knockoff } : { ...nextHs, permanentStockGainedThisRound2: nextHs.permanentStockGainedThisRound2 + knockoff };
      log.push({
        kind: "knockoff",
        instanceId: hireling.id,
        stockGained: knockoff,
        atSeconds: state.elapsedSeconds
      });
    }
    if (customerState.bewitchedByIds.includes(hireling.id) && nextHs.bewitchLevel < MAX_BEWITCH_LEVEL) {
      nextHs = { ...nextHs, bewitchLevel: nextHs.bewitchLevel + 1 };
    }
    const hirelingStates = new Map(state.hirelingStates);
    hirelingStates.set(hireling.id, nextHs);
    let working = {
      ...state,
      hirelingStates,
      gold: state.gold + goldEarned,
      reputation: state.reputation + reputationDelta,
      log
    };
    working = applyPostSaleAbility(working, hireling, haggled, state.elapsedSeconds);
    for (const ally of activeHirelings(state.board)) {
      if (ally.id === hireling.id) continue;
      working = applyOnAllySaleAbility(working, ally, hireling, state.elapsedSeconds);
    }
    for (const bewitcherId of customerState.bewitchedByIds) {
      const bewitcher = activeHirelings(state.board).find((h) => h.id === bewitcherId);
      if (!bewitcher) continue;
      working = applyOnBewitchedCustomerSale(
        working,
        bewitcher,
        hireling,
        goldEarned,
        state.elapsedSeconds
      );
    }
    return working;
  }

  // src/opponent/snapshot.ts
  function captureSnapshot(params) {
    if (!Number.isInteger(params.round) || params.round < 1) {
      throw new Error(
        `captureSnapshot round must be a positive integer (got ${params.round}).`
      );
    }
    if (!params.id) {
      throw new Error("captureSnapshot id must be a non-empty string.");
    }
    return {
      id: params.id,
      round: params.round,
      board: params.board,
      prices: params.prices,
      activePotionTypes: params.activePotionTypes,
      reputation: params.reputation
    };
  }

  // src/opponent/settlement.ts
  function tally(customers) {
    let won = 0;
    let lost = 0;
    let noSale = 0;
    let unresolved = 0;
    for (const cs of customers) {
      switch (cs.resolvedFor) {
        case "player":
          won++;
          break;
        case "opponent":
          lost++;
          break;
        case "no-sale":
          noSale++;
          break;
        case null:
          unresolved++;
          break;
      }
    }
    return { won, lost, noSale, unresolved };
  }
  function settleRound(state) {
    const counts = tally(state.customers);
    return {
      gold: state.gold,
      reputation: state.reputation,
      customersWon: counts.won,
      customersLost: counts.lost,
      customersNoSale: counts.noSale,
      customersUnresolved: counts.unresolved,
      playerWonRound: counts.won > counts.lost
    };
  }

  // src/charmed/merge.ts
  var CHARM_MERGE_COUNT = 3;
  function findCharmableTriple(board, hand) {
    const buckets = /* @__PURE__ */ new Map();
    const collect = (loc) => {
      if (loc.instance.charmed) return;
      if (loc.instance.potionType === null) return;
      const key = `${loc.instance.card.id}|${loc.instance.potionType}`;
      let list = buckets.get(key);
      if (!list) {
        list = [];
        buckets.set(key, list);
      }
      list.push(loc);
    };
    for (let i = 0; i < board.slots.length; i++) {
      const inst = board.slots[i];
      if (inst) collect({ instance: inst, source: { kind: "board", slot: i } });
    }
    for (let i = 0; i < hand.cards.length; i++) {
      const card = hand.cards[i];
      if (isHireling(card)) {
        collect({ instance: card, source: { kind: "hand", index: i } });
      }
    }
    for (const [key, list] of buckets) {
      if (list.length >= CHARM_MERGE_COUNT) {
        const [a, b, c] = list.slice(0, CHARM_MERGE_COUNT);
        return {
          cardId: a.instance.card.id,
          potionType: a.instance.potionType,
          members: [a, b, c]
        };
      }
    }
    return null;
  }
  function buildCharmedInstance(members, id) {
    var _a, _b, _c, _d;
    const [a, b, c] = members.map((m) => m.instance);
    const baseStock = (_b = (_a = a.card.potions[0]) == null ? void 0 : _a.stock) != null ? _b : 0;
    const basePotency = (_d = (_c = a.card.potions[0]) == null ? void 0 : _c.potency) != null ? _d : 0;
    const sumStock = baseStock * 3 + a.permanentStockBonus + b.permanentStockBonus + c.permanentStockBonus;
    const sumPotency = basePotency * 3 + a.permanentPotencyBonus + b.permanentPotencyBonus + c.permanentPotencyBonus;
    return createHirelingInstance(a.card, id, a.potionType, {
      permanentStockBonus: sumStock - baseStock,
      permanentPotencyBonus: sumPotency - basePotency,
      charmed: true
    });
  }
  function mergeCharmableTriple(triple, state, charmedId) {
    const handSources = triple.members.filter((m) => m.source.kind === "hand").map((m) => m.source).sort((x, y) => y.index - x.index);
    const boardSources = triple.members.filter((m) => m.source.kind === "board").map((m) => m.source).sort((x, y) => y.slot - x.slot);
    const projectedHandSize = state.hand.cards.length - handSources.length + 1;
    if (projectedHandSize > MAX_HAND_SIZE) {
      throw new Error(
        `Charmed merge would overflow the hand (projected ${projectedHandSize} > max ${MAX_HAND_SIZE}). Free a hand slot and retry.`
      );
    }
    let hand = state.hand;
    for (const src of handSources) {
      hand = removeFromHand(hand, src.index).hand;
    }
    let board = state.board;
    for (const src of boardSources) {
      board = sellHirelingFromBoard(board, src.slot).board;
    }
    const consumedInstanceIds = new Set(
      triple.members.map((m) => m.instance.id)
    );
    const { pool } = removeFromPoolWhere(
      state.pool,
      (inst) => consumedInstanceIds.has(inst.id)
    );
    const charmed = buildCharmedInstance(triple.members, charmedId);
    hand = addToHand(hand, charmed);
    return { board, hand, pool, charmed };
  }
  var defaultCharmedIdCounter = 0;
  function mergeIfCharmable(state, charmedIdFor = (id) => `charmed-${id}-${Date.now()}-${defaultCharmedIdCounter++}`) {
    const triple = findCharmableTriple(state.board, state.hand);
    if (!triple) return { ...state, charmed: null };
    return mergeCharmableTriple(triple, state, charmedIdFor(triple.cardId));
  }

  // src/charmed/charms.ts
  var CHARM_SPELL_IDS = [
    "tip-jar-charm",
    "second-chance-charm",
    "lucky-charm"
  ];
  var CHARM_SPELL_CARDS = (() => {
    const cards = [];
    for (const id of CHARM_SPELL_IDS) {
      const card = ALL_SPELLS.find((s) => s.id === id);
      if (!card) {
        throw new Error(
          `Missing Charm spell "${id}" in ALL_SPELLS \u2014 cards.csv out of sync.`
        );
      }
      cards.push(card);
    }
    return Object.freeze(cards);
  })();
  function pickRandomCharm(rng) {
    return pick(CHARM_SPELL_CARDS, rng);
  }
  var TIP_JAR_GOLD = 3;
  var LUCKY_POTENCY_BONUS = 3;
  var defaultCharmIdCounter = 0;
  function playCharmed(board, hand, handIndex, slot, rng, charmIdFor = (id) => `charm-${id}-${Date.now()}-${defaultCharmIdCounter++}`) {
    const card = hand.cards[handIndex];
    if (!card || !isHireling(card)) {
      throw new Error(`Hand index ${handIndex} is not a hireling.`);
    }
    const wasCharmed = card.charmed;
    const played = playHirelingFromHand(board, hand, handIndex, slot);
    if (!wasCharmed) {
      return { board: played.board, hand: played.hand, grantedCharm: null };
    }
    const charmCard = pickRandomCharm(rng);
    const handAfterGrant = addToHand(
      played.hand,
      createSpellInstance(charmCard, charmIdFor(charmCard.id))
    );
    return {
      board: played.board,
      hand: handAfterGrant,
      grantedCharm: charmCard
    };
  }
  function takeCharmFromHand(hand, handIndex, expectedId) {
    const card = hand.cards[handIndex];
    if (!card || !isSpell(card)) {
      throw new Error(`Hand index ${handIndex} is not a spell.`);
    }
    if (card.card.id !== expectedId) {
      throw new Error(
        `Hand index ${handIndex} is "${card.card.id}", not "${expectedId}".`
      );
    }
    const { hand: nextHand } = removeFromHand(hand, handIndex);
    return { hand: nextHand };
  }
  function castTipJarCharm(hand, handIndex, gold) {
    const { hand: nextHand } = takeCharmFromHand(
      hand,
      handIndex,
      "tip-jar-charm"
    );
    return { hand: nextHand, gold: gold + TIP_JAR_GOLD };
  }
  function castSecondChanceCharm(hand, handIndex, offering, pool, round, rng, opts) {
    const { hand: nextHand } = takeCharmFromHand(
      hand,
      handIndex,
      "second-chance-charm"
    );
    const refreshed = refreshShop(offering, pool, round, rng, opts);
    return { hand: nextHand, ...refreshed };
  }
  function castLuckyCharm(hand, handIndex, board, targetSlot) {
    const target = board.slots[targetSlot];
    if (!target) {
      throw new Error(`Target slot ${targetSlot} is empty.`);
    }
    const { hand: nextHand } = takeCharmFromHand(hand, handIndex, "lucky-charm");
    const buffed = {
      ...target,
      permanentPotencyBonus: target.permanentPotencyBonus + LUCKY_POTENCY_BONUS
    };
    const slots = board.slots.slice();
    slots[targetSlot] = buffed;
    return { hand: nextHand, board: { slots }, target: buffed };
  }

  // src/game/types.ts
  var MAX_ROUNDS = 15;
  var FIRST_ROUND = 1;
  var REPUTATION_MIN = -30;
  var REPUTATION_MAX = 100;

  // src/game/state.ts
  function createGame(options = {}) {
    var _a, _b, _c, _d;
    const rng = (_a = options.rng) != null ? _a : mulberry32(Date.now() >>> 0);
    const dustyBroom = ALL_HIRELINGS.find((h) => h.id === "dusty-broom");
    if (!dustyBroom) {
      throw new Error("Dusty Broom missing from ALL_HIRELINGS \u2014 cards.csv out of sync.");
    }
    const activePotionTypes = selectActivePotionTypes(rng);
    const { board, hand, broom } = createStarterBoard(
      dustyBroom,
      activePotionTypes,
      rng
    );
    const pool = assignPotionsToPool(createInitialPool(), activePotionTypes, rng);
    return {
      round: FIRST_ROUND,
      phase: "shop",
      outcome: "in-progress",
      gold: (_b = options.startingGold) != null ? _b : STARTING_GOLD,
      reputation: clampReputation((_c = options.startingReputation) != null ? _c : 0),
      board,
      hand,
      pool,
      offering: createEmptyOffering(),
      prices: defaultPriceMap(activePotionTypes),
      activePotionTypes,
      discovery: createDiscovery(),
      opponent: (_d = options.opponent) != null ? _d : null,
      action: null,
      starterBroom: broom
    };
  }
  function clampReputation(rep) {
    if (!Number.isFinite(rep)) {
      throw new Error(`reputation must be a finite number (got ${rep}).`);
    }
    return Math.max(REPUTATION_MIN, Math.min(REPUTATION_MAX, rep));
  }

  // src/game/shop-phase.ts
  function paydayDueNow(state) {
    return isPaydayRound(state.round);
  }
  function paydayLineItems(state) {
    const idx = paydayIndex(state.round);
    if (idx === null) return [];
    return allHirelings(state.board).filter((h) => !isExemptFromPayday(h.wageTracker)).filter((h) => h.wageTracker.paydaysSurvived < idx).filter((h) => h.wageTracker.lastPaidRound !== state.round).filter((h) => h.acquiredAtRound === 0 || h.acquiredAtRound < state.round).map((h) => {
      const wage = currentWageDemand(h.wageTracker);
      return {
        hireling: h,
        wage,
        canPay: canAfford(state.gold, wage),
        sellValue: SELL_VALUE
      };
    });
  }
  function payWage(state, hirelingId) {
    const slot = state.board.slots.findIndex((s) => (s == null ? void 0 : s.id) === hirelingId);
    if (slot === -1) {
      throw new Error(`payWage: hireling "${hirelingId}" not on the board.`);
    }
    const hireling = state.board.slots[slot];
    if (isExemptFromPayday(hireling.wageTracker)) {
      throw new Error(`payWage: "${hirelingId}" is payday-exempt.`);
    }
    const idx = paydayIndex(state.round);
    if (idx === null) {
      throw new Error(
        `payWage: round ${state.round} is not a payday round (${PAYDAY_ROUNDS.join(", ")}).`
      );
    }
    if (hireling.wageTracker.paydaysSurvived >= idx) {
      throw new Error(
        `payWage: "${hirelingId}" has already been paid this payday.`
      );
    }
    const wage = currentWageDemand(hireling.wageTracker);
    if (!canAfford(state.gold, wage)) {
      throw new Error(
        `payWage: need ${wage}g, only have ${state.gold}g.`
      );
    }
    if (hireling.wageTracker.lastPaidRound === state.round) {
      throw new Error(
        `payWage: "${hirelingId}" has already been paid at round ${state.round}.`
      );
    }
    const updated = {
      ...hireling,
      wageTracker: survivePayday(hireling.wageTracker, state.round)
    };
    const slots = state.board.slots.slice();
    slots[slot] = updated;
    return {
      ...state,
      board: { slots },
      gold: state.gold - wage
    };
  }
  function sellAtPayday(state, hirelingId) {
    const slot = state.board.slots.findIndex((s) => (s == null ? void 0 : s.id) === hirelingId);
    if (slot === -1) {
      throw new Error(`sellAtPayday: hireling "${hirelingId}" not on the board.`);
    }
    const res = sellHirelingFromBoardToPool(
      state.board,
      slot,
      state.pool,
      state.gold
    );
    return { ...state, board: res.board, pool: res.pool, gold: res.gold };
  }
  function startShopPhase(state, rng, options = {}) {
    if (state.phase !== "shop") {
      throw new Error(
        `startShopPhase: expected phase "shop", got "${state.phase}".`
      );
    }
    const reshuffledPool = assignPotionsToPool(
      // Fold any leftover offering cards back into the pool before we
      // reshuffle potion types across every copy.
      offeringInstances(state.offering).reduce(
        (pool, inst) => ({ instances: [...pool.instances, inst] }),
        state.pool
      ),
      state.activePotionTypes,
      rng
    );
    const rolled = refreshShop(
      { slots: state.offering.slots.map(() => null) },
      reshuffledPool,
      state.round,
      rng,
      options
    );
    const shownTypes = [];
    for (const inst of offeringInstances(rolled.offering)) {
      if (inst.card.kind === "hireling" && inst.potionType) {
        shownTypes.push(inst.potionType);
      }
    }
    const discovery = markSeenMany(state.discovery, shownTypes);
    return {
      ...state,
      pool: rolled.pool,
      offering: rolled.offering,
      discovery
    };
  }

  // src/game/action-phase.ts
  function endShopPhase(state, rng) {
    if (state.phase !== "shop") {
      throw new Error(
        `endShopPhase: expected phase "shop", got "${state.phase}".`
      );
    }
    let action = initializeActionState(
      state.board,
      state.prices,
      state.activePotionTypes,
      rng,
      state.gold,
      state.reputation
    );
    if (state.opponent) action = setOpponent(action, state.opponent);
    return { ...state, phase: "action", action };
  }
  function addActionCustomer(state, customer) {
    if (state.phase !== "action" || !state.action) {
      throw new Error(
        `addActionCustomer: no action phase in progress (phase=${state.phase}).`
      );
    }
    return { ...state, action: addCustomer(state.action, customer) };
  }
  function tickAction(state, deltaSeconds, rng) {
    if (state.phase === "game-over") return state;
    if (state.phase !== "action" || !state.action) {
      throw new Error(
        `tickAction: no action phase in progress (phase=${state.phase}).`
      );
    }
    return { ...state, action: tick(state.action, deltaSeconds, rng) };
  }
  function promotePermanentBuffs(state) {
    if (!state.action) return state.board;
    let slots = state.board.slots.slice();
    for (const h of activeHirelings(state.board)) {
      const hs = state.action.hirelingStates.get(h.id);
      if (!hs) continue;
      const slotGain = hs.permanentStockGainedThisRound;
      const potGain = hs.permanentPotencyGainedThisRound;
      const slot2Gain = hs.permanentStockGainedThisRound2;
      const pot2Gain = hs.permanentPotencyGainedThisRound2;
      if (slotGain === 0 && potGain === 0 && slot2Gain === 0 && pot2Gain === 0) {
        continue;
      }
      const slot = state.board.slots.findIndex((s) => (s == null ? void 0 : s.id) === h.id);
      if (slot === -1) continue;
      const promoted = {
        ...h,
        permanentStockBonus: h.permanentStockBonus + slotGain,
        permanentPotencyBonus: h.permanentPotencyBonus + potGain,
        permanentStockBonus2: h.permanentStockBonus2 + slot2Gain,
        permanentPotencyBonus2: h.permanentPotencyBonus2 + pot2Gain
      };
      slots[slot] = promoted;
    }
    return { slots };
  }
  function resolveOutcome(reputation, nextRound, tally2) {
    if (reputation >= REPUTATION_MAX) {
      return { outcome: "win", phase: "game-over" };
    }
    if (reputation <= REPUTATION_MIN) {
      return { outcome: "loss", phase: "game-over" };
    }
    if (nextRound > MAX_ROUNDS) {
      return {
        outcome: tally2.player > tally2.opponent ? "win" : "loss",
        phase: "game-over"
      };
    }
    return { outcome: "in-progress", phase: "shop" };
  }
  function endRound(state) {
    if (state.phase !== "action" || !state.action) {
      throw new Error(
        `endRound: no action phase in progress (phase=${state.phase}).`
      );
    }
    const finalized = applyEndOfRoundHooks(finalizeRound(state.action));
    const boardWithBuffs = promotePermanentBuffs({
      ...state,
      action: finalized
    });
    const nextRound = state.round + 1;
    const tally2 = { player: 0, opponent: 0 };
    for (const cs of finalized.customers) {
      if (cs.resolvedFor === "player") tally2.player++;
      else if (cs.resolvedFor === "opponent") tally2.opponent++;
    }
    const { outcome, phase } = resolveOutcome(finalized.reputation, nextRound, tally2);
    return {
      ...state,
      round: Math.min(nextRound, MAX_ROUNDS),
      phase,
      outcome,
      gold: finalized.gold,
      reputation: clampReputation(finalized.reputation),
      board: boardWithBuffs,
      action: null
    };
  }
  function runActionToCompletion(state, deltaSeconds, rng, maxIterations = 500) {
    if (state.phase !== "action" || !state.action) {
      throw new Error(
        `runActionToCompletion: no action phase in progress (phase=${state.phase}).`
      );
    }
    let current = state;
    let i = 0;
    while (current.action && current.action.customers.some((c) => c.resolvedFor === null) && i < maxIterations) {
      current = tickAction(current, deltaSeconds, rng);
      i++;
    }
    return current;
  }

  // src/export/columns.ts
  var EXPORT_COLUMNS = Object.freeze([
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
    "Ability Text"
  ]);

  // src/export/rows.ts
  function formatStarRating(rating) {
    if (rating === 1) return "\u2B50";
    if (rating === 2) return "\u2B50\u2B50";
    return "";
  }
  function formatCastTime(castTime) {
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
  function formatKeywords(keywords, fallback) {
    if (keywords.length === 0) return fallback;
    return keywords.map((k) => k.count !== void 0 ? `${k.name} x${k.count}` : k.name).join(" / ");
  }
  function formatStock(slot) {
    if (!slot) return "";
    return slot.stock === 0 ? "" : String(slot.stock);
  }
  function formatPotency(slot) {
    return slot ? String(slot.potency) : "";
  }
  function hirelingRow(card) {
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
      "Ability Text": card.abilityText
    };
  }
  function spellRow(card) {
    return {
      Guild: "Spell",
      Name: card.name,
      "Star Rating": formatStarRating(card.starRating),
      "Wage Tier": "N/A",
      "Round Available": card.roundAvailable === null ? "N/A" : String(card.roundAvailable),
      "Pool Count": card.poolCount === null ? "N/A" : String(card.poolCount),
      "Potion 1 Stock": "N/A",
      "Potion 1 Potency": "N/A",
      "Potion 2 Stock": "N/A",
      "Potion 2 Potency": "N/A",
      "Cast Time": "N/A",
      Keywords: formatKeywords(card.keywords, "None"),
      "Ability Text": card.abilityText
    };
  }
  function cardToExportRow(card) {
    return card.kind === "hireling" ? hirelingRow(card) : spellRow(card);
  }
  function allExportRows() {
    const rows = [];
    for (const card of ALL_HIRELINGS) rows.push(cardToExportRow(card));
    for (const card of ALL_SPELLS) rows.push(cardToExportRow(card));
    return rows;
  }
  function escapeCsvField(value) {
    if (/[",\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  function toCsv(rows) {
    const lines = [];
    lines.push(EXPORT_COLUMNS.map(escapeCsvField).join(","));
    for (const row of rows) {
      lines.push(EXPORT_COLUMNS.map((col) => escapeCsvField(row[col])).join(","));
    }
    return lines.join("\n") + "\n";
  }
  function exportAllCardsAsCsv() {
    return toCsv(allExportRows());
  }

  // src/export/download.ts
  var DEFAULT_EXPORT_FILENAME = "price-charming-cards.csv";
  function browserApis() {
    const g = globalThis;
    const doc = g["document"];
    const URLCtor = g["URL"];
    const BlobCtor = g["Blob"];
    if (!doc || !URLCtor || !BlobCtor || typeof URLCtor.createObjectURL !== "function") {
      return null;
    }
    return {
      document: doc,
      URL: URLCtor,
      Blob: BlobCtor
    };
  }
  function downloadCardsExport(filename = DEFAULT_EXPORT_FILENAME) {
    const csv = exportAllCardsAsCsv();
    const apis = browserApis();
    if (!apis) return csv;
    const blob = new apis.Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = apis.URL.createObjectURL(blob);
    const anchor = apis.document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    apis.document.body.appendChild(anchor);
    anchor.click();
    apis.document.body.removeChild(anchor);
    apis.URL.revokeObjectURL(url);
    return csv;
  }
  return __toCommonJS(index_exports);
})();
