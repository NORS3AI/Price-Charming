export interface PatchNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

/**
 * Versioning scheme:
 * - Starts at V0.0.1-alpha
 * - Increments the patch number up to V0.0.100-alpha
 * - Then rolls over to V0.1.0-alpha and continues
 */
export const PATCH_NOTES: PatchNote[] = [
  {
    version: "V0.4.2-alpha",
    date: "2026-04-21",
    title: "Part-2 Phase 9 — Ambiguous abilities",
    changes: [
      "HirelingActionState: new bonusQuickcraftPerCast (round-only, default 0). The Quickcraft fire path now adds it to the keyword count when generating temp stock.",
      "Wired hirelings:",
      "The Muffin Man — at ROUND START (not per cast — applies to every cast of every Quickcraft ally that round), every active Quickcraft ally gets bonusQuickcraftPerCast += 2. Doughboy adjacent to Muffin Man casts +4 temp stock instead of +2.",
      "The Grand Thief — per cast: +2 temp stock for each OTHER Thieves ally with Knockoff; then for each Thieves ally with Knockoff (incl. self), if potency < 10 grant +1 perm stock (mimics Knockoff outside a sale).",
      "Spare Charming — listens for no-player-sale resolutions (via the existing applyOnNoPlayerSaleAbility hook). MVP: every no-sale grants Spare Charming +3 perm pot. (Spec says \"Haggled sale fails\"; we don't track haggle-attempt-failures distinctly so all no-sales count.)",
      "Sugar Rush Peddler — per cast: nudges own nextCastIn down by 0.5s × (sales fired so far this round). One-shot reduction at cast time rather than a sticky cross-cast accumulator.",
      "Tasting Table — when a customer would resolve as no-sale AND a Tasting Table is on an active slot AND her potion type matches AND she has stock, the resolution is upgraded to player-sale; +1 temp stock to every Sugar Guild ally except herself. Narrow window because pickSalesHireling already finds her in the normal player-win path; the redirect only fires when no other matching seller exists.",
      "4 new tests in ambiguous-abilities.test.ts. 480 → 484 tests.",
    ],
  },
  {
    version: "V0.4.1-alpha",
    date: "2026-04-21",
    title: "Part-2 Phase 8 — Cross-player opponent effects",
    changes: [
      "Round-start hooks split: opponent-dependent cards (Batter Boy, Frosted Lookout) now run after setOpponent in endShopPhase via runOpponentDependentRoundStartHooks. Non-opp cards still fire from initializeActionState as before.",
      "Wired hirelings:",
      "Robbin Goblin — per-cast: when own potency < 5 AND the opponent has any active hireling, +1 permanent stock to self. (\"Steal\" from opponent's lowest-pot hireling rendered as own gain since opponent state is a snapshot.)",
      "Puss in Boots — per-cast: every unresolved customer with reputationStars > 1 loses 1 star, Puss gains +1 permanent stock per star stolen. Stacks with Knockoff x5 and Haggle.",
      "Batter Boy — at round start (after opp wired): +3 temporary stock per opponent Sabotage hireling on an active slot. One-shot approximation of \"each time opp sabotages\" since opponent casts aren't simulated.",
      "Frosted Lookout — at round start (after opp wired): if the opponent has any Sabotage hireling, fires the player's highest-potency Sugar Guild ally's applyPostCastAbility once.",
      "Deferred: Miss Fortune Teller (\"start of shop round, +1 stock per customer the opp won\") needs a cross-round opponent customer-tally tracker on GameState. Not yet wired — the round-recap path captures customer counts but doesn't persist a between-rounds tally accessible to round-start hooks.",
      "5 new tests in cross-player.test.ts. 475 → 480 tests.",
    ],
  },
  {
    version: "V0.4.0-alpha",
    date: "2026-04-21",
    title: "Part-2 Phase 7 — Round-start targeting",
    changes: [
      "MVP: random targeting at round start instead of a mid-battle UI picker. Spec called for a player picker; implementing the engine path first lets these cards function while the UI layer is deferred to a polish pass.",
      "HirelingActionState: new `potencyGainsDoubled: boolean` (round-only). buffHireling doubles any positive `potencyGained` it applies to a hireling carrying this flag.",
      "applyRoundStartAbility now takes RNG and wires three more hirelings:",
      "The Royal Tutor — at round start, picks a random ally that is NOT another Royal Tutor and NOT Dusty Broom; grants +1 permanent stock + +1 permanent potency.",
      "The Kingmaker — picks a random Nobles Guild ally and flips potencyGainsDoubled=true for the round. Every subsequent permanent-potency buff to that ally lands at 2×.",
      "Tower Escapee — picks a random non-self ally and trims 1s off their nextCastIn (clamped at 0.1s). One-shot at round start.",
      "5 new tests in round-start-targeting.test.ts: Royal Tutor's non-Tutor / non-Broom filter, no-eligible-ally no-op, Kingmaker's potency doubling on a Sprinkler buff, Tower Escapee's 1s nudge and clamp. 470 → 475 tests.",
      "Mid-battle player picker UI deferred — round-start random targeting handles the engine semantics; UI layer can be retrofitted later without breaking existing wiring.",
    ],
  },
  {
    version: "V0.3.9-alpha",
    date: "2026-04-21",
    title: "Part-2 Phase 6 — Buff-event bus",
    changes: [
      "buffHireling now fires applyOnPermanentBuffEvent for every active ally (except the buffed target itself) on every permanent-buff emission. The log-entry pipeline doubles as an event bus.",
      "A `reentrant` flag on buffHireling skips the cascade when called from inside a reactive hook so amplifying cards don't infinite-loop.",
      "Wired hirelings:",
      "Court Jester — +1 temporary stock per ally permanent stock buff; +1 permanent potency this round per ally permanent potency buff. Direct hirelingState mutation (bypasses the cascade).",
      "Grand Vizier — per cast, copies the last permanent buff any ally received and re-applies it to himself. (His decreasing cast time still ticks down; once at 0 he's stopped.)",
      "Court Scribe — per cast, looks up the most recent ability-buff entry and adds +1 to whichever stat that buff increased, applied to the original target.",
      "Candy Architect — reactive: when any Sugar Guild ally gains permanent potency, gains +2 permanent stock this round. (MVP simplification: spec said \"next Quickcraft generates +2 additional stock\"; current implementation grants the buff at event time rather than tracking a per-cast Quickcraft modifier.)",
      "4 new tests in buff-events.test.ts. 466 → 470 tests.",
    ],
  },
  {
    version: "V0.3.8-alpha",
    date: "2026-04-21",
    title: "Part-2 Phase 5 — Dual-potion data model",
    changes: [
      "Engine: HirelingInstance gains potionType2 / permanentStockBonus2 / permanentPotencyBonus2 so cards with two CSV potion slots (Pickpocket Pixie, Jumping Jack, Lady's Maid, Almost-A-Knight, etc.) actually carry two potions.",
      "HirelingActionState gains parallel slot-1 trackers: temporaryStock2 / permanentStockGainedThisRound2 / permanentPotencyGainedThisRound2 / unitsSoldThisRound2.",
      "assignPotionsToPool now picks a SECOND, distinct active type for slot 1 whenever the card has 2 potion slots.",
      "pickSalesHireling refactored into pickSalesHirelingWithSlot — returns {hireling, slot}. Sales hit whichever slot matches the customer's desired type and has effective stock; Knockoff bumps the SLOT that just sold (not always slot 0).",
      "combinedStockForType / combinedPotencyForType now sum BOTH slot contributions across the board, so the pricing panel correctly reflects two-potion hirelings.",
      "computePassiveContribution / overBudgetPressure now match either slot's potionType against the customer's desired type, and use the matching slot's stock/potency for axis fills.",
      "promotePermanentBuffs at end-of-round promotes BOTH slots' gained stock/potency.",
      "3 new tests in dual-potion.test.ts: dual-slot sales (love → slot 0, luck → slot 1), pricing aggregation across two pixies with overlapping slot-0 and distinct slot-1 types, and synthetic permanentStockBonus2 / permanentPotencyBonus2 carryover into the panel. 463 → 466 tests.",
      "Deferred to a later polish pass: per-slot UI rendering on the slot card (tooltip already shows both slots), per-slot routing of ability-buffs (currently buffs go to slot 0 by convention), and per-slot Quickcraft routing (no current Quickcraft card has 2 potions).",
    ],
  },
  {
    version: "V0.3.7-alpha",
    date: "2026-04-21",
    title: "Part-2 Phase 4 — Sabotage-reactive hirelings",
    changes: [
      "Two new event hooks built on top of Phase 3's Sabotage primitive: applyOnAllySabotageAbility fires for every other active ally each time any hireling Sabotages; applyOnOwnSabotageSuccess fires for the caster after their own Sabotage lands.",
      "applyPostCastAbility signature gained an `rng` parameter so per-card abilities can pick random targets (Royal Advisor's noble pick).",
      "New helper pickHighestPotencyOpponent for Prince of Thieves's curse-target.",
      "Wired hirelings:",
      "Snitch Witch — once-per-round +1 permanent stock when ANY ally fires Sabotage. Once-per-round constraint enforced via log inspection (no need for an extra HirelingActionState field).",
      "The Saboteur — each successful own Sabotage trims 0.5s off every Thieves ally's `nextCastIn` (clamped at 0.1s). Stacks per cast since nextCastIn is recomputed after each fire.",
      "Royal Advisor — per-cast (in addition to the keyword Sabotage that already targets a random opponent), picks a Nobles Guild ally on the active row at random and grants +2 permanent stock + +2 permanent potency. Spec's \"next action gains +2 to all stat effects permanently\" relaxed to \"+2/+2 permanent\" since per-cast next-action gating would require its own track.",
      "Prince of Thieves — per-cast: −2 reputation, then emits a sabotage log entry against the opponent's highest-potency active-slot hireling with secondsAdded=3. Rep cost applies even when no opponent target exists.",
      "Skipped (deferred to Phase 8 — cross-player effects): Batter Boy and Frosted Lookout both react to opponents USING Sabotage, but the engine doesn't simulate opponent casts. They stay inert until the cross-player phase wires opponent-side cast events.",
      "7 new tests in sabotage.test.ts. 456 → 463 tests.",
    ],
  },
  {
    version: "V0.3.6-alpha",
    date: "2026-04-21",
    title: "Part-2 Phase 3 — Sabotage primitive",
    changes: [
      "Sabotage keyword now actually fires every cast: applySabotage picks one opponent active-slot hireling per the card's policy and emits a `sabotage` log entry with `targetInstanceId` + `secondsAdded`.",
      "Per-card target picker (pickSabotageTarget) defaults to RANDOM among the opponent's active slots. Sticky Fingers overrides to pick the LOWEST base-cast-time opponent (Passive ignored, decreasing → start, random → max).",
      "Sabotage count honored: bare Sabotage keyword adds SABOTAGE_DEFAULT_SECONDS = 1; The Saboteur's `Sabotage x2` adds 2.",
      "Wired hirelings:",
      "The Highwayman — Sabotage + Bewitch + Knockoff x3, all keyword-driven (Sabotage adds +1s to a random opponent on every 7s cast).",
      "The Saboteur — Sabotage x2 + Knockoff x1 (random target, +2s). Per-card Thieves-ally cast-reduction reactive deferred to Phase 4.",
      "Sticky Fingers — picks opponent's lowest-cast hireling (per-card override) and grants self +2 temporary stock per cast. Stacks with its Knockoff x2.",
      "Engine doesn't simulate opponent casts (the snapshot is a passive ghost), so the slowdown is consumed by the UI's visual `pcOppAction`: pcBattleTick now scans new sabotage log entries since the last frame and extends the matching opponent hireling's `nextCastIn` by `secondsAdded`. Player sees the cast bar visibly slow.",
      "Battle log surfaces sabotage entries as `sabotage: caster → target (+Ns cast)`.",
      "7 new tests in sabotage.test.ts: keyword fires/no-fires, count override, lowest-cast targeting, random determinism across seeds, multi-cast scaling. 449 → 456 tests.",
    ],
  },
  {
    version: "V0.3.5-alpha",
    date: "2026-04-21",
    title: "Shop scroll lock + target-spell click-through",
    changes: [
      "Shop phase: scrolling down to view spells / hand / payday no longer snaps back to the top on every UI update. `pcRender` now caches `window.scrollY` before each rebuild and restores it after the sub-renders finish, so price-tweaks and other in-place mutations don't clamp scroll to 0.",
      "Target spells (Bottomless Bottle, Potion Polish, Lucky Charm): the dim overlay was `z-index: 200` covering the whole screen, which silently swallowed every click on a hireling — the spell appeared frozen because the click was hitting the overlay's `onclick=pcCancelTarget`. Overlay is now `pointer-events: none` (still dims the screen) with `pointer-events: auto` on the message box (so Cancel works), and targetable slot cards get `z-index: 201` so they sit above the dim AND receive the click. Cancel-by-clicking-outside-the-box is replaced by the explicit Cancel button — both intents covered.",
    ],
  },
  {
    version: "V0.3.4-alpha",
    date: "2026-04-21",
    title: "Part-2 Phase 2 — Bewitch-reactive hirelings",
    changes: [
      "Two new event hooks built on top of Phase 1's Bewitch primitive: applyOnOwnBewitchSuccess fires when a hireling's Bewitch tags ≥1 customer; applyOnBewitchedCustomerSale fires inside executeSale once for each bewitcher of the buying customer.",
      "Per-card target picker pickBewitchTargets lets specific cards override the default \"first N unresolved\" logic. Champion Knight and The Prince now correctly target only the HIGHEST-reputation unresolved customer.",
      "Wired hirelings:",
      "Lady's Maid — random ally +1 permanent potency on Bewitch success (RNG threaded through fireCast).",
      "Knight Errant — self +3 permanent potency only when the Bewitched customer has >= 3 reputation stars.",
      "Part-Time Potioneer — self +2 permanent potency on Bewitch success.",
      "The Squire — copies Knight Errant's reactive: if a Knight Errant is on an active slot AND a tagged customer has 3+ stars, Squire gains +3 permanent potency. (Cast-time copy deferred — would need an effectiveCastTime override.)",
      "Champion Knight — targets only the highest-rep customer; on that customer's purchase, all Nobles Guild allies gain +2 permanent potency.",
      "The Prince — targets only the highest-rep customer; on purchase, self +3 permanent potency, all Nobles Guild allies +1 permanent potency.",
      "Masked Minstrel — when its Bewitched customer buys (and Masked Minstrel is the seller), reverses the gold from that sale and grants +3 permanent stock instead. Stacks with Knockoff x2.",
      "8 new tests cover each card. 441 → 449 tests.",
    ],
  },
  {
    version: "V0.3.3-alpha",
    date: "2026-04-21",
    title: "Title-screen breathing room + Settings Back fix",
    changes: [
      "Title screen: added padding above the logo so it's no longer pinned to the top edge.",
      "Settings → Back: was a no-op because `leaveSettings()` was referenced in the HTML but never defined. The function now routes intelligently — if a game is in flight, return to the game screen; otherwise back to the title menu.",
    ],
  },
  {
    version: "V0.3.2-alpha",
    date: "2026-04-21",
    title: "Tutorial back + Sandbox retired",
    changes: [
      "Removed the Sandbox menu item — never wired into the current build and confusing alongside Play and Show Off.",
      "Tutorial button now opens a real How-to-Play screen (previously a placeholder flash). Explains the shop phase, action phase, 4-axis weighted-priority customer tug-of-war, stock-OR-potency pricing brackets, Bewitch, Show Off, and the new early-resolve rule.",
      "Patch-notes discipline: a new CLAUDE.md note requires every engine/UI commit to land with a patch-notes entry first so the in-app changelog stays in sync with the codebase.",
    ],
  },
  {
    version: "V0.3.1-alpha",
    date: "2026-04-21",
    title: "Early customer resolution (Dusty Broom finally sells fast)",
    changes: [
      "Customers now commit to a sale as soon as one side holds a decisive weighted lead (>= 5 on the 10-point scale) instead of always idling until patience expiry. Dusty Broom's base-stock 5 finally converts in the first few seconds of round 1 against a matching-type customer.",
      "New engine helper: `determineEarlyWinner(state)` returns the leading side when `weightedLeadScore(winner) - weightedLeadScore(loser) >= EARLY_RESOLVE_MIN_DIFF` (5). Player wins only early-resolve when `pickSalesHireling` can actually fulfill; opponent wins resolve unconditionally (ghost always fulfills).",
      "Tick loop checks early-resolve every iteration after applying passive contributions.",
      "Two straggler tests updated to reflect the new semantics; two new tests pin the +5 threshold + opponent-side symmetry + already-resolved guard. 439 → 441 tests.",
    ],
  },
  {
    version: "V0.3.0-alpha",
    date: "2026-04-21",
    title: "Show Off: persistent card collection",
    changes: [
      "New Show Off screen on the title menu: a grid of every collectible card (hirelings + spells). Discovered cards render as full tiles clickable to read ability/keyword detail; undiscovered render as dashed outlines with a centered `?`.",
      "`pcCollection` keyed by `card.id`, persisted to localStorage under `pc-collection-v1`. Scans run from every `pcAfterChange` and at game start (so Dusty Broom + pre-placed hirelings count).",
      "Dusty Broom excluded from the grid (always given). Charmed hirelings tag the base card id, so merging doesn't hide the original from the collection.",
      "Audit followups: collection reads use an Object.create(null)-protected map to avoid prototype-chain pollution; ESC closes the card-detail modal; unknown guilds (future Merlin's Academy) render in a dynamically-appended trailing group.",
    ],
  },
  {
    version: "V0.2.9-alpha",
    date: "2026-04-21",
    title: "Weighted axes + stock-OR-potency pricing + opponent cast bars",
    changes: [
      "Customer axes are now rendered in each customer's personal priority order with ★-pip weight indicators. The top axis has 4x the pull of the bottom one — leading just the top axis beats leading the two lowest (4 vs 3), but loses to leading the other three (4 vs 3+2+1=6).",
      "Pricing brackets unlock on `max(combined stock, combined potency)` across all hirelings selling that potion type. Same breakpoints (1-8, 9-16, ..., 63+); either stat alone suffices. The panel now shows both totals side-by-side with the currently-driving stat highlighted.",
      "Opponent cast bars tick alongside the player's via a visual-only ActionState. Uses an independent RNG so random-cast-time opponent hirelings don't drain the player sim's draws.",
      "Dusty Broom's \"Cannot be buffed\" clause now centralized in `buffHireling` + `addTemporaryStock`. Sugar Sprinkler, Oven Master, Lord Chamberlain, Fence Master, Ogreachiever, Confectioner, The Duchess, The Page, The Herald, Almost-A-Knight, Pickpocket Pixie, Apprentice Baker all inherit the immunity automatically.",
      "The Queen wired: per-cast grants +1 reputation star to every unresolved customer (on top of her Bewitch keyword).",
      "Payday double-billing fix + cache-bust: introduced `lastPaidRound` on WageTracker so a hireling acquired between paydays is no longer billed two (or more) retroactive wages in one round. Bundle script now hashes engine.js and stamps the script tag's `?v=` query so updates bypass browser cache.",
      "9 more hireling abilities wired (Pantry Stocker end-of-round, Cookie Seller first-sale, The Page on-ally-sale, The Herald per-cast, Apprentice Baker on-ally-Quickcraft, Almost-A-Knight on-haggled-sale, Pickpocket Pixie on-sale, Royal Treasurer end-of-round, Goblin King round-start, Grumblegut Dragon per-cast, Crooked Confessor passive, Nimble Ned on-no-sale).",
      "Out-of-stock sale bug fixed: a customer that lost on axes could previously show \"✓ Won\" without any actual gold/stock change when no matching-type hireling had stock. Both `tick` and `finalizeRound` now demote that resolution to `\"no-sale\"` before the log.",
    ],
  },
  {
    version: "V0.2.8-alpha",
    date: "2026-04-21",
    title: "Part-2 Phase 1 — Bewitch primitive",
    changes: [
      "Added Bewitch engine primitive: every cast of a hireling with the Bewitch keyword pushes the player's focus axis by BEWITCH_FOCUS_BURST (40) on up to `bewitchLevel` unresolved customers, and tags those customers with the caster's instance id.",
      "HirelingActionState: new `bewitchLevel` field, default 1, capped at MAX_BEWITCH_LEVEL (2). Bumps by +1 when this hireling sells to a customer it previously Bewitched, matching the keyword spec (\"after this sells, next Bewitch affects an additional customer\").",
      "CustomerState: new `bewitchedByIds` field tracking which player-side hirelings have Bewitched this customer. Drives the sale-to-Bewitched-customer bump and the UI sparkle badge.",
      "ActionLogEntry union: new `bewitch` variant { casterId, customerIds, focusBurst, atSeconds }.",
      "Wired the keyword-only cards automatically (Candied Witch, Masked Minstrel primary Bewitch, The Queen). The per-card REACTIVE clauses (Lady's Maid, Knight Errant, Champion Knight, Prince, Part-Time Potioneer, Squire, Masked Minstrel sell-reward) stay for Part-2 Phase 2.",
      "UI: bewitched customer cards show a ✨ 'Bewitched' pill next to the potion icon; battle log prints bewitch entries.",
      "8 new tests cover focus burst, no-double-bewitch, bewitchLevel bump + cap, level-2 targets two customers, no-op on empty queue, non-Bewitch hireling silent. 430 → 438 tests.",
    ],
  },
  {
    version: "V0.2.7-alpha",
    date: "2026-04-20",
    title: "Phase 11 — Export to Excel (admin tool)",
    changes: [
      "src/export/columns.ts: EXPORT_COLUMNS matches cards.csv header exactly so exports round-trip through the loader.",
      "src/export/rows.ts: cardToExportRow serializes Card objects back to column-keyed rows with every CSV quirk preserved — Quickcraft hirelings get blank stock cells, star ratings become ⭐/⭐⭐, spells fill N/A in the non-applicable columns, hirelings without keywords render empty while spells without keywords render 'None'. formatCastTime covers all 4 variants (5s / Passive / 1-8s (random) / 7s (reduces by 1s per cast)). toCsv + exportAllCardsAsCsv write the full card dump with RFC-4180 quoting.",
      "src/export/download.ts: downloadCardsExport(filename?) triggers a browser download via feature-detected globalThis (document + Blob + URL.createObjectURL). In Node it simply returns the CSV string so tests and tooling can still use it. Output includes a UTF-8 BOM so Excel renders ⭐ correctly. Default filename: price-charming-cards.csv.",
      "Round-trip verified: parseCards(exportAllCardsAsCsv()) reproduces every keyword (including The Saboteur's Sabotage x2 / Knockoff x1), every cast-time variant (Grand Vizier decreasing, Royal Advisor random), and every spell N/A column.",
      "All exported from src/index.ts. 17 new Jest tests (373 total); tsc clean; dist smoke-tested with a full write → read-back through the Node filesystem.",
      "Phase 11 is the final phase of the 11-phase rollout — the engine surface is complete.",
    ],
  },
  {
    version: "V0.2.6-alpha",
    date: "2026-04-20",
    title: "Phase 10 — Round Structure (full 15-round game loop)",
    changes: [
      "10A src/game/types.ts + state.ts: GameState bundles board, hand, pool, offering, prices, activePotionTypes, discovery, opponent, action, gold, reputation, round, phase ('shop' | 'action' | 'game-over'), outcome ('in-progress' | 'win' | 'loss'), and the starter Dusty Broom. createGame(options?) seeds round 1: picks 5 active potion types, places Dusty Broom at slot 3 with a bound potion, assigns potion types across the fresh pool, initializes prices at 1g, empty discovery/offering, opponent/action null. clampReputation enforces the -30/+30 envelope.",
      "10B src/game/shop-phase.ts: paydayDueNow(state) + paydayLineItems(state) surface non-exempt board hirelings (bench included, Dusty Broom excluded) with wage/canPay/sellValue. payWage deducts gold + advances the wage tracker; sellAtPayday returns the copy to the pool (Dusty Broom disappears permanently). startShopPhase reshuffles pool potion types and rolls a fresh shop for free (spec: reshuffle at each shop phase, never on refresh).",
      "10C src/game/action-phase.ts: endShopPhase → ActionState initialized from board/prices/activeTypes, opponent snapshot installed if attached. tickAction advances time; addActionCustomer admits customers. endRound force-resolves stragglers (with sales), promotes per-round Knockoff / potency gains onto board HirelingInstance permanent bonuses, rolls up gold + reputation, advances the round, and decides outcome (win at +30 rep or positive rep at round 15; loss at -30 rep or non-positive rep at round 15). runActionToCompletion ticks until every customer resolves.",
      "All symbols exported from src/index.ts. 39 new Jest tests across game init (determinism, Dusty Broom placement, pool assignment), shop phase (payday, reshuffle + reroll), and action phase (customer lifecycle, buff promotion, outcome branches). 354 tests total; tsc clean.",
      "Dist smoke-tested end-to-end: round 1 shop rolls 5 slots → action with a Gretel-style customer → customer resolves → endRound advances to round 2 with outcome still in-progress.",
    ],
  },
  {
    version: "V0.2.5-alpha",
    date: "2026-04-20",
    title: "Phase 9 — Charmed Hirelings + Charm Cards",
    changes: [
      "9A HirelingInstance gains permanentStockBonus, permanentPotencyBonus, charmed (defaults 0/0/false). createHirelingInstance accepts an options bag; pricing/potency.ts and action/state.ts effective* helpers now factor in cross-round bonuses so Knockoff promotions, Charmed merges, and Lucky Charm all flow through pricing and sales math.",
      "9A src/charmed/merge.ts: CHARM_MERGE_COUNT=3, findCharmableTriple walks board+hand for 3 instances of the same card.id sharing the same non-null potionType (skips Charmed and unassigned). buildCharmedInstance sums effective stats from all 3 (base × 3 + Σ bonuses), keeps card / cast time / potion type, fresh wage tracker, charmed: true. mergeCharmableTriple swaps the 3 sources out of board/hand, drops the matching pool instances permanently, and lands the new Charmed in the player's hand. mergeIfCharmable convenience wrapper.",
      "9B src/charmed/charms.ts: CHARM_SPELL_IDS + CHARM_SPELL_CARDS resolve the three Charm spells from the loader. playCharmed wraps playHirelingFromHand and grants a random Charm (via pickRandomCharm) when the played hireling is Charmed. castTipJarCharm adds +3 gold; castSecondChanceCharm refreshes the shop without spending gold; castLuckyCharm grants +3 permanent potency to a friendly board hireling. All consume the spell from the hand.",
      "All exported from src/index.ts. 25 new Jest tests (314 total) — merge detection edge cases, summed-stats math, Charmed-don't-re-merge, Charm card grant on Charmed play, cast effects for each Charm. dist smoke-tested: 3 Doughboys merge to Charmed (+8 potency bonus), playing it grants Tip Jar Charm, Lucky Charm buffs Pantry Stocker by +3 potency.",
    ],
  },
  {
    version: "V0.2.4-alpha",
    date: "2026-04-20",
    title: "Phase 8 — Opponent System (async ghost)",
    changes: [
      "src/opponent/snapshot.ts: OpponentSnapshot captures another player's build at a specific round — board, prices, activePotionTypes, reputation, plus a stable id for leaderboards. captureSnapshot validates the round is a positive integer.",
      "ActionState now carries opponent: OpponentSnapshot | null; setOpponent installs the ghost.",
      "tick() now applies per-second passive contributions from every active hireling on the opponent's snapshot to the opponent side of each customer's 4-axis tug-of-war, using the snapshot's own effective prices (built from its own board and price map). Opponent contributions share the same patience cap as the player's.",
      "src/opponent/settlement.ts: finalizeRound force-resolves every straggling customer using their current fills. settleRound returns a RoundResult tallying gold, reputation delta, customersWon / customersLost / customersNoSale / customersUnresolved, plus playerWonRound (player won more customers than the opponent).",
      "Dist smoke test: player starting with only Dusty Broom vs opponent with a Pantry Stocker selling the same type correctly resolves the customer for the opponent and settleRound.playerWonRound = false.",
      "Deferred (not bugs): opponent casts, Quickcraft temp stock accrual, and cast-triggered keyword effects on the opponent side. Current model treats opponent hirelings as pure passive contributors — sufficient for 'async ghost' flavour, richer simulation can land in a future balance pass.",
      "9 new Jest tests across captureSnapshot validation, opponent-stealing-customer, mirrored-boards tie → no-sale, setOpponent replacement, and finalizeRound / settleRound tallies. 289 tests total; tsc clean.",
    ],
  },
  {
    version: "V0.2.3-alpha",
    date: "2026-04-20",
    title: "Phase 7 — Action Round (casts, customers, sales, weather)",
    changes: [
      "7A src/action/types.ts + state.ts: ActionState immutably wraps elapsedSeconds, a board, per-active-hireling HirelingActionState (cast timer, casts so far, temp stock, per-round permanent gains, units sold), and a structured log. tick(state, dt, rng) progresses timers and fires casts — multi-cast ticks carry overshoot into the next timer. firstCastDelay/nextCastDelay translate all four CastTime variants (seconds, passive, random, decreasing). Quickcraft xN adds +N temp stock on every cast.",
      "7B Customer lifecycle: addCustomer admits a fresh CustomerState and logs arrival; tick applies per-second passive contributions (spec leans: stock→focus, potency→quality, set price→budget, potion type→type) from every active hireling, ticks patience, and resolves on expiration with a customer-resolved log entry. Effective prices come from buildPricingPanel so the Budget axis respects the price cap.",
      "7C Sales: when a customer resolves for the player, the highest-potency in-stock matching hireling rings them up. rollUnitsPerInteraction draws units from the stock bracket (capped by stock). pricePerUnit = effective price + 3g for Haggle. goldEarned and reputationDelta update the ActionState's running totals (Haggle costs -1 rep per sale). Knockoff xN fires when current potency < 10, granting +N permanent stock this round. New sale and knockoff log entries.",
      "7D Weather placeholder: Weather type + tickWeather with duration decay. setWeather installs; tick clears when duration expires. Effect payload is opaque for now — concrete mechanics land in a future balance pass.",
      "All symbols exported from src/index.ts. 36 new Jest tests across cast-delay math, multi-cast overshoot, Grand Vizier's decreasing cast wind-down (7 casts in 28s), passive-contribution-driven customer resolution, sale economics (Haggle +3g/-1rep, Knockoff trigger), and weather duration decay. 280 tests total; tsc clean; dist smoke-tested.",
    ],
  },
  {
    version: "V0.2.2-alpha",
    date: "2026-04-20",
    title: "Phase 6 — Customer System",
    changes: [
      "src/customers/types.ts: Customer (desiredType, budget, qualityThreshold, reputationStars 1-5, patienceSeconds, axisPriority), AxisKind union (focus/type/budget/quality), AxisBar {playerFill, opponentFill}, CustomerState, AXIS_THRESHOLD=100.",
      "src/customers/state.ts: createCustomerState validates axis priority completeness and reputation bounds; applyContribution clamps fills to [0, AXIS_THRESHOLD] and no-ops on resolved customers; tickPatience decrements and floors at 0; axisLeader / axesLedBy / determineWinner / resolveCustomer resolve per-axis leads and break ties via the customer's axisPriority list; reputationReward returns the customer's stars on a player win only.",
      "src/customers/contributions.ts: PASSIVE_RATES (tunable) + computePassiveContribution turns a single active hireling's stock, potency, price, and potion-type match into per-second contributions following the spec leans (Stock→Focus, Potency→Quality, Set Price→Budget, Potion Type→Type); overBudgetPressure returns the drain a price-above-budget hireling exerts on the opposing side's Budget bar.",
      "All symbols exported from src/index.ts. Customers are pure data — Phase 7 will wire them into the action-round timer loop.",
      "31 new Jest tests across state transitions, priority-based tiebreakers, and passive contribution math (245 total). dist smoke-tested end-to-end: 5s of passive play from Pantry Stocker on Love → player leads on all 4 axes, resolves for 3 reputation.",
    ],
  },
  {
    version: "V0.2.1-alpha",
    date: "2026-04-20",
    title: "Phase 5 — Potion Pricing",
    changes: [
      "src/pricing/brackets.ts: PRICE_BRACKETS table matches the spec exactly (1-8→1g, 9-16→2g, ..., 63+→8g cap). maxPriceForPotency(combinedPotency) and potencyToNextBracket(combinedPotency) drive the panel's max-price and 'X potency to next tier' messaging. MIN_PRICE=1, MAX_PRICE=8, CAP_POTENCY=63. Frozen at runtime.",
      "src/pricing/potency.ts: combinedPotencyForType / combinedPotencyFromBoard / combinedPotencyMap sum potency across ACTIVE-slot hirelings (bench excluded per spec) whose potionType matches. Hirelings with null potionType contribute nothing.",
      "src/pricing/panel.ts: PriceMap stores per-active-type prices; defaultPriceMap initializes everything at 1g; setPrice clamps to [MIN_PRICE, maxAllowed] and rejects non-integers. buildPricingPanel returns one PricingPanelEntry per active type with combinedPotency, storedPrice, effectivePrice (clamped), currentMax, and a PricingStatus tag (no-stock / below-cap with potencyToNextTier / at-cap).",
      "applyHaggle(panelPrice, hireling): per-hireling +3g modifier (not in the panel). Used by Phase 6/7 when a Haggle hireling rings up a sale.",
      "src/pricing/stock.ts: unitsRange(stock) maps stock to {min,max} units per customer interaction (1-5→1, 6-15→1-2, 16-30→2-3, 31+→3-4). rollUnitsPerInteraction(stock, rng) draws a value in that range, capped by remaining stock.",
      "All exported from src/index.ts. 33 new Jest tests across brackets, combined potency, panel state and clamping, Haggle modifier, and stock brackets (214 total). dist smoke-tested end-to-end.",
    ],
  },
  {
    version: "V0.2.0-alpha",
    date: "2026-04-20",
    title: "Phase 4 — Shop System (pool, potions, Spring Cleaning)",
    changes: [
      "4A Potion types: 7 PotionTypeMeta entries with icons and flavor; ACTIVE_POTION_COUNT=5; selectActivePotionTypes chooses 5 of 7 at game start; PotionDiscovery tracker for the hover panel; mulberry32 seeded RNG, shuffle, pick helpers.",
      "4B Shop pool: ShopPool as a list of PoolInstance copies (one per card-copy, with ids like 'doughboy#0'); createInitialPool excludes Dusty Broom and Charm cards; takeFromPool / returnToPool / removeFromPoolWhere for lifecycle; poolAvailableAtRound respects each card's roundAvailable (Spring Cleaning gates at round 6, general spells available from any round).",
      "4C Potion assignment: HirelingInstance now carries potionType; assignPotionsToPool re-rolls potion types for every hireling copy at the start of each shop phase (refresh does NOT re-roll); assignHirelingPotion for singletons like the starter Dusty Broom.",
      "4D Shop offering: ShopOffering with DEFAULT_SHOP_SIZE=5 slots; rollShop draws uniformly without replacement from round-eligible pool with at most one spell slot per roll (DEFAULT_SPELL_CHANCE=0.25); refreshShop returns the prior offering to the pool and re-rolls; takeFromOffering for purchases.",
      "4E Purchase & sell wiring: buyHirelingFromShop / buySpellFromShop deduct 4g / 2g and hand-full-check; refreshShopWithCost charges 1g; sellHirelingFromBoardToPool / sellHirelingFromHandToPool add +1g and return the copy to the pool carrying its potion type; Dusty Broom disappears permanently on sell.",
      "4F Spring Cleaning: castSpringCleaning dispatches by spell id — base removes all Low-wage (Tier 1) hirelings and drops an upgraded copy into the pool with a deterministic id ('spring-cleaning-upgraded#from-<cast-id>'); Spring Cleaning (Upgraded) removes all Medium-wage (Tier 2) hirelings. The upgraded form starts excluded from the initial pool and only appears after a base cast.",
      "End-to-end verified: from 5 starting gold, Dusty Broom at slot 4, the flow selects potions → reshuffles pool → rolls a round-3 shop → buys a hireling → casts Spring Cleaning → watches 74 Low-wage hirelings leave the pool.",
      "77 new Jest tests across potions, pool, assignment, offering, purchase, and Spring Cleaning (181 total); dist smoke-tested.",
    ],
  },
  {
    version: "V0.1.9-alpha",
    date: "2026-04-20",
    title: "Phase 3 — Board & Hand Layout",
    changes: [
      "Added src/board/types.ts: HirelingInstance (wraps a HirelingCard with a WageTracker and a unique instance id), SpellInstance, HandCardInstance, Hand, and Board.",
      "Added src/board/hand.ts: MAX_HAND_SIZE=8, createHand, handSize, isHandFull, addToHand (throws if full), removeFromHand, plus isHireling/isSpell narrowing helpers. Hand holds both hirelings and spells.",
      "Added src/board/board.ts: BOARD_SIZE=7 with BENCH_SLOTS [0,6] (1-indexed slots 1 and 7) and ACTIVE_SLOTS [1,2,3,4,5] (1-indexed slots 2-6), STARTER_SLOT=3 (center active).",
      "Board helpers: createBoard, isBenchSlot, isActiveSlot, isBoardFull, firstEmptySlot, activeHirelings, benchHirelings, allHirelings.",
      "Play/sell/rearrange: placeHireling, playHirelingFromHand (throws if the hand card is a spell or the slot is occupied), sellHirelingFromBoard, sellHirelingFromHand (throws on spells per spec), rearrangeBoard (splice-insert — cards between shift to accommodate).",
      "Added src/board/starter.ts: createDustyBroomInstance and createStarterState — places Dusty Broom at slot 3 (1-indexed slot 4) with a None-tier payday-exempt tracker.",
      "Sell returns include SELL_VALUE so callers apply the gold delta; spells still cannot be sold.",
      "BENCH_SLOTS and ACTIVE_SLOTS frozen at runtime for safety.",
      "All new symbols exported from src/index.ts.",
      "32 new Jest tests covering hand lifecycle, board placement, bench/active filters, play/sell/rearrange semantics, and starter setup. 103 tests total; dist smoke-tested.",
    ],
  },
  {
    version: "V0.1.8-alpha",
    date: "2026-04-20",
    title: "Phase 2 — Economy, Wages, and Payday",
    changes: [
      "Added src/economy/gold.ts: STARTING_GOLD=5, COST_HIRELING=4, COST_SPELL=2, COST_REFRESH=1, SELL_VALUE=1, plus canAfford().",
      "Added src/economy/wages.ts: per-tier wage table (Low 2→10, Medium 4→12, High 6→14, None 0) and a WageTracker type for per-hireling payday escalation.",
      "wageFor(), currentWageDemand(), survivePayday(), createWageTracker(), and isExemptFromPayday() handle the +2g-per-payday escalation and the Dusty Broom exemption.",
      "Added src/economy/payday.ts: PAYDAY_ROUNDS [3,6,9,12,15], GLOW_ROUNDS [2,5,8,11,14], and helpers paydayIndex, nextPaydayRound, roundsUntilPayday, isPaydayRound, isGlowRound.",
      "buildPaydayLineItems(gold, trackers) returns one item per non-exempt hireling with wage, canPay, and sellValue so the payday UI can present Pay/Sell per hireling with the affordability flag driving the greyed-out Pay button.",
      "All new symbols exported from src/index.ts.",
      "31 new Jest tests across gold constants, wage schedule and tracker escalation, payday schedule helpers, and line-item construction. 65 tests total; compiled dist verified.",
    ],
  },
  {
    version: "V0.1.7-alpha",
    date: "2026-04-20",
    title: "Phase 1 — Core Data & Keywords",
    changes: [
      "Rebuilt the card type system: Guild, HirelingGuild, WageTier, StarRating, Keyword (with optional xN count), CastTime variants (seconds, passive, random, decreasing, none), PotionSlot, HirelingCard, SpellCard.",
      "Added a keyword registry (src/cards/keywords.ts) with engine-facing and player-facing definitions for Sabotage, Bewitch, Knockoff, Haggle, Quickcraft, plus the spell-only Charm tag.",
      "Added a minimal CSV parser (src/cards/csv-parser.ts) that handles quoted fields, embedded commas, escaped quotes, and CRLF line endings.",
      "Added a loader (src/cards/loader.ts) that turns src/data/cards.csv into typed Card objects, deriving kebab-case ids from card names.",
      "Cast Time strings parse into structured variants (e.g. '1-8s (random)' → random, '7s (reduces by 1s per cast)' → decreasing, 'Passive' → passive).",
      "Quickcraft hirelings whose printed stock is blank now resolve to a base stock of 0 per the keyword spec.",
      "ALL_HIRELINGS (72 - 9 = 63) and ALL_SPELLS (9) are now loaded from the CSV at module import.",
      "Added Jest coverage: 24 tests across keyword definitions, CSV parser edge cases, and loader output (specific cards, guild distribution, multi-keyword parsing, kebab id quirks like Lady's Maid).",
      "Note: The CSV occasionally uses Sabotage xN (e.g. The Saboteur 'Sabotage x2'). The parser preserves these counts even though the design spec restricts xN to Knockoff/Haggle/Quickcraft.",
    ],
  },
  {
    version: "V0.1.6-alpha",
    date: "2026-04-20",
    title: "System Reset & Full Game Spec",
    changes: [
      "Cleared all previously defined hireling and spell card data — no cards, stats, abilities, keywords, or spell definitions retained.",
      "Removed obsolete spell systems: transformations, upgrades, and Wishing Star (replaced by the Charmed Hireling merge mechanic).",
      "Hireling registry (src/cards/hirelings.ts) is now empty pending Phase 1 rebuild from src/data/cards.csv.",
      "Documented full game systems in CLAUDE.md, README.md, and FEATURES.md: Hand & Board, Economy, Payday, Potion Pricing, Potion Types, Customers, Charmed Hirelings, Hover Tooltips, and Export to Excel.",
      "Hand: max 8 cards, holds both hirelings and spells; spells cannot be sold.",
      "Board: 7 slots — slots 1 & 7 are bench (still pay wages, no casts); slots 2-6 are active.",
      "Economy: 5 starting gold, hireling 4g, spell 2g, refresh 1g, sell 1g; gold rolls over.",
      "Dusty Broom starter: pre-placed slot 4, exempt from payday, cannot be Sabotaged or buffed, never in pool.",
      "Payday triggers rounds 3/6/9/12/15 with glow warnings on rounds 2/5/8/11/14; wages escalate +2g per payday survived.",
      "Wage tiers (flat): Low 2g, Medium 4g, High 6g, None for starters.",
      "Potion pricing brackets: 1-8 potency=1g, up through 63+=8g cap; Haggle adds +3g per sale at -1 reputation.",
      "Stock-to-units rules: 1-5 stock=1 unit, 6-15=1-2, 16-30=2-3, 31+=3-4 per customer interaction.",
      "Potion types: 7 total (Love, Dragon's Breath, Mermaid's Tears, Goblin's Greed, Luck, Half-Curse Cure, Flutterfix); 5 of 7 are randomly active per run; player discovers via shop browsing.",
      "Potion type reshuffle happens at the start of each shop phase; refreshing the shop does not reshuffle.",
      "Keywords spec: Sabotage, Bewitch, Knockoff (xN), Haggle, Quickcraft (xN); only Knockoff/Haggle/Quickcraft accept xN. Hover tooltips list every keyword definition at the bottom.",
      "Customers: 4-axis tug-of-war (Focus, Type, Budget, Quality) with patience timers and 1-5 star reputation rewards; passive hirelings naturally lean by stat (Stock→Focus, Potency→Quality, Set Price→Budget, Potion Type→Type).",
      "Charmed Hireling: 3 copies of the same hireling with the same potion type merge instantly into the hand; playing a Charmed onto the board grants a random Charm card (Tip Jar, Second Chance, or Lucky).",
      "Shop rule: at most 1 spell per refresh across all general and guild-specific spells (Merlin's Academy will override later).",
      "Planned admin tool: Export to Excel button on the home page exports all hireling and spell data using the cards.csv schema.",
    ],
  },
  {
    version: "V0.1.5-alpha",
    date: "2026-04-19",
    title: "11-Phase Rollout Plan",
    changes: [
      "Documented the 11-phase rollout plan in README.md, CLAUDE.md, and FEATURES.md.",
      "Added src/data/cards.csv — master card list across Sugar Guild, Thieves Guild, Nobles Guild, No Guild, and Spells.",
      "Phase 1: Core Data & Keywords — load card CSV, define all keywords (Quickcraft, Knockoff, Bewitch, Haggle, Sabotage, Charm, Passive).",
      "Phase 2: Economy System — gold, wages, payday escalation.",
      "Phase 3: Board & Hand Layout — 7 board slots, bench, hand UI.",
      "Phase 4: Shop System — pool management, potion assignment, Spring Cleaning.",
      "Phase 5: Potion Pricing — pricing panel, brackets, stock effects.",
      "Phase 6: Customer System — 4-axis tug-of-war, patience timers.",
      "Phase 7: Action Round — auto-battler combat, weather events.",
      "Phase 8: Opponent System — async ghost opponent.",
      "Phase 9: Charmed Hireling — merge mechanic, charm cards.",
      "Phase 10: Round Structure — full 15-round game loop.",
      "Phase 11: Export Button — admin tool.",
    ],
  },
  {
    version: "V0.1.4-alpha",
    date: "2026-04-09",
    title: "Sellable Spells",
    changes: [
      "Spells in your hand can now be sold for 1 gold each.",
      "Each hand spell shows a 'Sell 1g' button, same as hireling cards.",
      "Free up hand slots when you don't need a spell anymore.",
    ],
  },
  {
    version: "V0.1.3-alpha",
    date: "2026-04-09",
    title: "Layout Polish & Battle Snap",
    changes: [
      "Shop side panel moved to lower-left so it doesn't block content behind it.",
      "Battle phase now centers the screen on the customer area when combat starts.",
      "Title logo has an animated purple glow that pulses between 20px and 40px radius.",
      "Centered Leaderboard title and compensated button text for letter-spacing.",
    ],
  },
  {
    version: "V0.1.2-alpha",
    date: "2026-04-09",
    title: "Epic Victory Confetti",
    changes: [
      "Confetti now bursts higher, flying well past the top of the screen.",
      "150 particles across 3 waves for sustained celebration.",
      "3 different animation paths: straight up, spinning drift, wandering drift.",
      "Larger particles (up to 3.8rem) with golden drop-shadow glow.",
      "6 firework bursts with colored radial bursts in 8 different colors.",
      "New emojis: 💎🔮🎇🎆🌠 added to the celebration pool.",
    ],
  },
  {
    version: "V0.1.1-alpha",
    date: "2026-04-09",
    title: "Shop Side Panel & Settings Access",
    changes: [
      "Added a left side panel during shopping phase showing Round, Tier, Gold, Reputation (as number), and Goal.",
      "Added a Settings button to the side panel so you can access settings mid-game.",
      "Settings back button now returns to the game if opened from the shop, otherwise returns to main menu.",
      "Side panel collapses above the game area on small screens (mobile/tablet).",
      "In-game patch notes now auto-generated from src/patch-notes.ts via a pre-commit hook — no more manual HTML edits.",
    ],
  },
  {
    version: "V0.1.0-alpha",
    date: "2026-04-09",
    title: "Epic Victory, Font Settings, Spell Fixes",
    changes: [
      "Spells cancelled or cast with no valid target now return to the hand (no more lost spells).",
      "All difficulty modes start with 3 gold (was variable).",
      "Countdown timer fixed at 3 seconds (Insane still 0).",
      "Countdown now fires before battle, not before shopping.",
      "Font size setting in Settings: Small, Medium, Large, XL. Cards and layout scale proactively.",
      "Enhanced Victory screen: glowing animated title, confetti shower, fanfare music.",
      "Name input on victory: enter your name to save to the leaderboard.",
      "Leaderboard now stores custom player names instead of 'You'.",
      "Free Gingerbread Man (0 gold) always in round 1 shop.",
      "Removed duplicate Start Battle button from shop area.",
      "Disabled drag-and-drop on mobile/tablet (long-press for details only).",
      "Fixed save/load system with error handling and overwrite support.",
    ],
  },
  {
    version: "V0.0.8-alpha",
    date: "2026-04-09",
    title: "Round Timer & Tutorial Mode",
    changes: [
      "Round transition timer: countdown between rounds scales by difficulty (Easy 10s, Normal 5s, Hard 2s, Insane 0s).",
      "Big countdown numbers zoom in from small, pulse, then fade each second.",
      "Sound tick on each countdown number.",
      "Tutorial mode: guided 5-round experience teaching every game mechanic.",
      "Royal-themed tutorial info boxes with gold headers, red/blue accents.",
      "Covers: gold, shop, hirelings, potions, pricing, battles, customers, reputation, spells, upgrades, transformations.",
      "Round 1-3: player wins (easy opponents). Round 4: player loses (tough opponent, explains why). Round 5: player wins (tutorial complete).",
      "Weighted randomness: tutorial picks different dialog variants each playthrough for replayability.",
      "Tutorial accessible from difficulty selection screen.",
    ],
  },
  {
    version: "V0.0.7-alpha",
    date: "2026-04-09",
    title: "Menus, Difficulty, Leaderboard, Settings, Sandbox & Rich Tooltips",
    changes: [
      "Main menu: Play, Leaderboard, Sandbox, Settings buttons.",
      "Difficulty selection: Easy (2 gold), Normal, Hard, Insane (0 gold) with scaling opponents.",
      "Renamed 'coins' to 'gold' everywhere.",
      "Leaderboard: top 15 players with NPC placeholder names. Victories save to board.",
      "Settings: sound toggle, 3 save slots with save/load/delete, reset all data.",
      "Auto-save after each battle to slot 1.",
      "Sandbox: deck builder with full card pool. Click to add cards, test battle with custom deck.",
      "Rich colorful tooltips: gold header bar, colored potion stat badges (potency/stock/price), pros & cons list, upgrade/transform hints, total output calculation.",
      "Mobile/tablet: long-press (500ms hold) to show tooltip on touch devices.",
      "Fixed: PumpkinMouse added to TypeScript, stock values synced, price field added to PotionSlot type, version mismatch resolved.",
      "Created icon folder structure: docs/assets/icons/ with difficulty, hirelings, spells, customers, ui subfolders.",
    ],
  },
  {
    version: "V0.0.6-alpha",
    date: "2026-04-09",
    title: "Battle Sidebar & Round Reports",
    changes: [
      "Customer sidebar during battle: shows won/lost/pending customers as icons on the right edge.",
      "Hover over any completed customer icon to see detailed stats (your sales vs opponent, gold earned, rep change, budget).",
      "Last Round Report button appears in the shop after your first battle.",
      "Report modal shows: round summary, every customer result with detailed stats, your full board stats, opponent's full board stats.",
      "All potion prices and potency visible in the report for analysis.",
    ],
  },
  {
    version: "V0.0.5-alpha",
    date: "2026-04-09",
    title: "Drag & Drop, Tooltips, Potion Pricing",
    changes: [
      "Drag and drop: drag cards from shop to your board to buy, drag board cards away to sell.",
      "Click-to-buy still works as a fallback.",
      "Hover tooltips: hover over any card to see full details — description, potions, stats, upgrade/transform hints.",
      "Potion panel: new panel during shopping shows all your hirelings' potions in a table.",
      "Adjustable potion pricing: set each potion's price from 0g to 5g using +/- buttons.",
      "Customer budget system: each customer has a budget tolerance. Overpriced potions are less effective.",
      "Higher prices earn more gold when you win a customer, but risk losing the sale.",
      "Customer info now shows their budget during battle.",
    ],
  },
  {
    version: "V0.0.4-alpha",
    date: "2026-04-09",
    title: "Upgrade System",
    changes: [
      "Upgrade system: 3 identical hirelings auto-merge into a stronger card on purchase.",
      "Little Piggy x3 upgrades to Big Bad Wolf (culinary, tier 2).",
      "Teacups x3 upgrades to Madame Teapot (enchanted, tier 2).",
      "Upgrade triggers instantly when the 3rd copy is purchased from the shop.",
      "Ascending fanfare sound effect on upgrade.",
      "Added Little Piggy and Teacups to TypeScript hireling definitions.",
      "14 new unit tests for the upgrade system.",
    ],
  },
  {
    version: "V0.0.3-alpha",
    date: "2026-04-09",
    title: "Hand System, Sound FX & Balance",
    changes: [
      "Transformation-only cards (Evil Royal, Poison Queen, etc.) no longer appear in the shop. They can only be obtained via Wishing Star.",
      "Hand system: spells purchased go to a hand (up to 5 cards). Play them anytime during the shop phase.",
      "Opponent scaling: opponent strength now scales with player board strength and round progression.",
      "Reputation bar now shows current value and goal numbers (e.g. -30 | 5 / 30 | 30).",
      "Logo support: title screen loads logo.jpg from docs/assets/ folder (falls back to text title).",
      "Sound effects: buy, sell, refresh, spell cast, potion sell, customer win/lose — all synthesized via Web Audio API.",
    ],
  },
  {
    version: "V0.0.2-alpha",
    date: "2026-04-08",
    title: "Playable Game Mockup",
    changes: [
      "Playable browser-based game prototype on GitHub Pages.",
      "Shopping phase: buy hirelings and spells from Fairy Godmother's shop, refresh for new cards, sell hirelings back.",
      "Battle phase: hirelings auto-cast on timers, competing against opponent to satisfy customers.",
      "Customer system: fairy-tale customers with satisfaction thresholds, gold rewards, and reputation stakes.",
      "Reputation system with -30/+30 bar and crunch mechanic in rounds 13-15.",
      "3 new tier-1 hirelings: Little Piggy, Teacups, Pumpkin Mouse.",
      "3 spells: Wishing Star (transform), Potency Boost (+1 potency), Quick Brew (-1s cast time).",
      "Opponent AI generates random boards scaled to the current round.",
      "Round progression up to 15 rounds with tier scaling (T1 rounds 1-3, T2 4-6, T3 7+).",
      "Win/lose conditions: max reputation to win, bottom out to lose.",
      "Battle log showing real-time potion sales and customer outcomes.",
      "10 fairy-tale customers: Gretel, Jack, Red Riding Hood, Goldilocks, Rapunzel, Hansel, Cinderella, The Baker, Pied Piper, Old King Cole.",
    ],
  },
  {
    version: "V0.0.1-alpha",
    date: "2026-04-08",
    title: "Foundation & Wishing Star Spell",
    changes: [
      "Project initialized with TypeScript, Jest, and GitHub Pages.",
      "Card type system: HirelingCard, SpellCard, AssistantCard with tiers and tribes.",
      "Added 3 transformable tier-1 hirelings: Hag, Frog, Hidden Princess.",
      "Added 6 tier-2 transformation results: Evil Royal, Poison Queen, Royal Fly Catch, Wart Covered Prince, Snow White, Master Pie Maker.",
      "Implemented Wishing Star spell — transforms a transformable hireling into one of two player-chosen upgraded forms.",
      "Transformation registry with extensible registration for future cards.",
      "Deep copy system ensures transformed cards don't share mutable state.",
      "17 unit tests covering all transformation paths and edge cases.",
      "Created CLAUDE.md, README.md, FEATURES.md, and patch notes system.",
      "GitHub Pages site with game info and patch notes viewer.",
    ],
  },
];

/** Returns the current (latest) version string. */
export function getCurrentVersion(): string {
  return PATCH_NOTES[0].version;
}

/** Returns all patch notes, newest first. */
export function getAllPatchNotes(): PatchNote[] {
  return [...PATCH_NOTES];
}

/**
 * Compute the next version string based on the current version.
 * V0.0.X-alpha increments patch until 100, then becomes V0.1.0-alpha.
 */
export function getNextVersion(): string {
  const current = PATCH_NOTES[0].version;
  const match = current.match(/^V(\d+)\.(\d+)\.(\d+)-alpha$/);
  if (!match) {
    throw new Error(`Unexpected version format: ${current}`);
  }

  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);

  if (patch >= 100) {
    return `V${major}.${minor + 1}.0-alpha`;
  }
  return `V${major}.${minor}.${patch + 1}-alpha`;
}
