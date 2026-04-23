# CLAUDE.md

## Project Overview

**Price Charming** is a fairy-tale themed auto-battler card game. Players run a potion shop using hirelings and spells to brew and sell potions to customers. Opponents are snapshot-based — you compete against recordings of other players' builds at the same round.

## Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Testing:** Jest with ts-jest
- **Build:** `tsc` (TypeScript compiler)
- **Hosting:** GitHub Pages (static site in `docs/`)

## Commands

- `npm test` — run all tests
- `npm run build` — compile TypeScript to `dist/`

## Project Structure

```
src/
  cards/
    types.ts        — Card type system (Guild, WageTier, Keyword, CastTime, HirelingCard, SpellCard…)
    keywords.ts     — Keyword registry with coding + player-facing definitions
    csv-parser.ts   — Minimal RFC-4180-style CSV parser
    loader.ts       — Parses cards.csv into typed Card objects
    hirelings.ts    — ALL_HIRELINGS (loaded from cards.csv)
    spells.ts       — ALL_SPELLS (loaded from cards.csv)
  economy/
    gold.ts         — Gold costs (starting, hireling, spell, refresh, sell)
    wages.ts        — Wage tier table + per-hireling WageTracker
    payday.ts       — Payday schedule (rounds 3/6/9/12/15) and line-item builder
  board/
    types.ts        — HirelingInstance (now includes potionType), SpellInstance, Hand, Board
    hand.ts         — Hand operations (max 8 cards, hirelings + spells)
    board.ts        — 7-slot board with bench/active helpers, play/sell/rearrange
    starter.ts      — Dusty Broom starter placement (center active slot)
  potions/
    types.ts        — 7 potion types with icons + flavor, ACTIVE_POTION_COUNT=5
    rng.ts          — RNG type, mulberry32 (seeded), shuffle, pick
    selection.ts    — selectActivePotionTypes (5 of 7)
    discovery.ts    — PotionDiscovery tracker for the hover panel
  shop/
    pool.ts         — Copy-instance pool (excludes Dusty Broom + Upgraded Spring Cleaning)
    assignment.ts   — Per-shop-phase potion-type reshuffle
    offering.ts     — rollShop / refreshShop / takeFromOffering (≤1 spell per roll)
    purchase.ts     — buy/sell wiring with gold and hand/board state
    spring-cleaning.ts — Cast effect: removes a wage tier from the pool; base upgrades itself
  pricing/
    brackets.ts     — PRICE_BRACKETS table, maxPriceForPotency, potencyToNextBracket
    potency.ts      — combinedPotencyByType across active-slot hirelings
    panel.ts        — PriceMap + PricingPanelEntry + buildPricingPanel + applyHaggle
    stock.ts        — unitsRange / rollUnitsPerInteraction (stock → units sold)
  customers/
    types.ts        — Customer, AxisKind, AxisBar, CustomerState, AXIS_THRESHOLD=100
    state.ts        — createCustomerState, applyContribution, tickPatience, resolveCustomer
    contributions.ts — passive per-second contribution per spec leans (stock→focus, etc.)
  action/
    types.ts        — ActionState, HirelingActionState, ActionLogEntry union
    state.ts        — initializeActionState, addCustomer, setWeather, setOpponent, tick
    weather.ts      — Weather placeholder with duration decay
  opponent/
    snapshot.ts     — OpponentSnapshot + captureSnapshot (async ghost recording)
    settlement.ts   — settleRound + RoundResult tally
  charmed/
    merge.ts        — findCharmableTriple + mergeCharmableTriple (3-of-a-kind merge)
    charms.ts       — playCharmed grants a random Charm; cast helpers for the 3 charms
  game/
    types.ts        — GameState, GamePhase, GameOutcome, MAX_ROUNDS, REPUTATION_MIN/MAX
    state.ts        — createGame, clampReputation (round-1 setup)
    shop-phase.ts   — paydayLineItems, payWage, sellAtPayday, startShopPhase
    action-phase.ts — endShopPhase, tickAction, addActionCustomer, endRound, runActionToCompletion
  export/
    columns.ts      — EXPORT_COLUMNS (matches cards.csv header)
    rows.ts         — cardToExportRow, toCsv, formatCastTime/Keywords, round-trip safe
    download.ts     — downloadCardsExport (browser file trigger; returns CSV in Node)
  data/
    cards.csv       — Master card data (Guild, Wage Tier, Round Available, Pool Count,
                      Potion 1/2 Stock & Potency, Cast Time, Keywords, Ability Text)
  patch-notes.ts    — Versioned patch notes data
  index.ts          — Public API exports
docs/
  index.html        — GitHub Pages site
```

> Phase 1 is complete: `cards/loader.ts` reads `src/data/cards.csv` at module load and produces typed `HirelingCard` / `SpellCard` objects. All five hireling keywords (Sabotage, Bewitch, Knockoff, Haggle, Quickcraft) plus the spell-only Charm tag are defined in `cards/keywords.ts` with both engine-facing and player-facing text.

## Game Phases

- **Shop Phase** — player buys/sells hirelings, refreshes the shop, plays spells, sets prices, and arranges the board.
- **Action Phase** — the marketplace opens; hirelings auto-cast on timers and sell potions to customers (autobattle).

## Guilds & Wage Tiers

- **Guilds:** Sugar Guild, Thieves Guild, Nobles Guild, No Guild, Spell. (Merlin's Academy planned later.)
- **Wage Tiers (flat rate, universal):** Low 2g · Medium 4g · High 6g · None (starter only).
- **Star Rating:** blank, ⭐, or ⭐⭐ marks rarity.

## Keywords

Keywords trigger upon completion of a hireling's cast (often alongside the cast's other action). Hirelings that don't cast don't have keywords. On hover, every keyword on a hireling must be defined at the bottom of the tooltip.

| Keyword | Coding Definition | Player-Facing Definition |
| --- | --- | --- |
| **Sabotage** | +1s to one opponent hireling's cast time until end of action round. Target is whatever the card specifies (highest cast time, lowest, random, etc.); default is random. | Increase an opponent hireling's cast time by 1s (until end of round). |
| **Bewitch** | Hireling gains customer Focus, drawing one customer's attention. After it sells to a Bewitched customer, the next Bewitch affects one additional customer simultaneously. Max 2 customers Bewitched at a time. | This hireling gains customer Focus. After it sells, its next Bewitch affects an additional customer. (Up to 2 at a time.) |
| **Knockoff xN** | After this hireling sells, if its current potency is below 10, gain +N permanent stock. | After this sells, if its potency is below 10, gain +N stock (permanently). |
| **Haggle** | Potions sold by this hireling are automatically priced 3g above the player's set price. Each Haggle sale costs −1 reputation. Per-hireling modifier; not shown in the pricing panel. | Potions sold by this hireling can be priced up to 3g above their set price; those sales grant −1 reputation. |
| **Quickcraft xN** | Base stock is always 0. After this hireling casts its action, gain +N temporary stock per cast. Temporary stock only exists during the action phase and resets to 0 at the start of each shop round. | Base stock is 0. After this acts, gain +N temporary stock. |

Only **Knockoff**, **Haggle**, and **Quickcraft** can appear as `[Keyword xN]`. **Bewitch** and **Sabotage** never take a number for now.

Temporary stats granted by hireling abilities revert when entering the shop phase — they only exist during the action phase.

## Hand & Board

### Hand
- Both hirelings and spells live in the player's hand during the shop phase.
- Displayed at the bottom of the screen. **Max 8 cards.**
- Hirelings purchased from the shop go directly into the hand.
- Spells purchased from the shop go directly into the hand.
- If the hand is full, the player cannot purchase more cards until space is freed.

### Playing & Selling
- **Play hireling:** drag from hand to one of the 7 board slots.
- **Sell hireling (from hand):** drag into the shop area — sells without ever placing on board.
- **Sell hireling (from board):** drag into the shop area — removes from board and sells permanently.
- **Spells cannot be sold**, only used.

### Board Layout (7 slots)
- Slots numbered left → right, **1–7**.
- **Slots 1 & 7** — Bench (darker/dimmed). Bench hirelings do **not** cast or contribute passively, but **do still pay wages**.
- **Slots 2–6** — Active. Five hirelings that fully participate in the action phase.
- **Shop phase:** all 7 slots visible; bench desaturated.
- **Action phase:** bench slots completely hidden — clean row of 5 active hirelings.

### Rearranging
- Click & drag any board hireling left/right to reorder; others shift to accommodate.
- Allowed during shop phase only — board is locked during action phase.

## Economy

### Starting state
- Player begins each game with **5 gold**.
- Player begins with one free **Dusty Broom** pre-placed in slot 4 (center active).

### Dusty Broom (starter)
- Guild: None · Wage: None (exempt from payday)
- 1 potion (random from the 5 active potion types) · Stock 5 · Potency 1 · Cast Time 5s
- Cannot be Sabotaged. Cannot be buffed.
- Can be sold for 1g; once sold it disappears permanently.
- Never appears in the card pool.

### Gold
- **Costs:** Hireling 4g · Spell 2g · Refresh 1g · Sell-back value 1g
- **Income:** earned exclusively through potion sales during the action phase. No passive income.
- **Rollover:** unspent gold carries between rounds.
- **Floor:** none beyond what hirelings sell. Dusty Broom's 5 stock provides a natural early-game floor.

### Payday
- Triggers at the start of shop rounds **3, 6, 9, 12, 15**.
- A single payday indicator is shown in the shop UI:
  - Normal rounds → neutral counter ("rounds until next payday").
  - Glow rounds (**2, 5, 8, 11, 14**) → indicator pulses to warn the player.
  - Payday rounds → resolution triggers before shop phase begins.
- Per hireling, the player either **Pay** (deduct wage) or **Sell** (return to pool, gain sell value). If the player can't afford a wage, the Pay option is greyed out.
- Bench hirelings are included in payday — no exceptions.

### Wage escalation (per hireling, +2g per payday survived)

| Payday # | Low | Medium | High |
| --- | --- | --- | --- |
| 1st | 2g | 4g | 6g |
| 2nd | 4g | 6g | 8g |
| 3rd | 6g | 8g | 10g |
| 4th | 8g | 10g | 12g |
| 5th | 10g | 12g | 14g |

- Tracked per hireling individually.
- Benching does **not** pause or reset the counter.
- Selling resets nothing — repurchase starts fresh at payday 1.
- Each hireling shows both its rounds-until-payday and its current wage demand.

## Potion Types

Seven total — each with a unique icon:

| Icon | Name | Flavor |
| --- | --- | --- |
| ❤️ | Love Potion | Results may vary |
| 🔥 | Dragon's Breath Tonic | A little spicy, a little smelly |
| 💧 | Mermaid's Tears Elixir | Not a product of a happy ending |
| 💰 | Goblin's Greed Brew | It's mine, mine, mine! |
| 🍀 | Luck Potion | — |
| 💀 | Half-Curse Cure | — |
| 🪽 | Flutterfix Tonic | Fixes wings |

- At the start of each game, **5 of 7** potion types are randomly selected (equal probability). The other 2 are inactive for that run.
- Future: each map will have a fixed set of 5; the random selection is temporary.
- **Reshuffle:** at the start of each shop phase, potion types are randomly reassigned across all hireling copies in the pool from the 5 active types. Refreshing the shop does **not** reshuffle — only advancing to the next shop phase does.
- **Discovery:** the player isn't told which 5 are active. They learn by browsing. A hover panel somewhere unobtrusive in the shop UI lists the potion types they've encountered so far; undiscovered types stay hidden.

## Potion Pricing

- Prices are set **per potion type**, not per hireling, and apply globally across all hirelings selling that type.
- Only the 5 active potion types have prices to set.
- Pricing panel (shop phase) shows for each active type:
  - Icon and name
  - Combined **stock** and combined **potency** totals across all hirelings selling that type (the higher of the two drives the tier)
  - Current price (player-adjustable)
  - Status: `+X stock → next tier` or `+X potency → next tier` (whichever is currently the limiting stat), or `Price cap reached` at the top bracket.

### Price brackets

The tier is unlocked by **max(combined stock, combined potency)** — either stat is enough to hit the bracket.

| max(Stock, Potency) | Max Price |
| --- | --- |
| 1–8 | 1g |
| 9–16 | 2g |
| 17–24 | 3g |
| 25–32 | 4g |
| 33–40 | 5g |
| 41–50 | 6g |
| 51–62 | 7g |
| 63+ | 8g (cap) |

- Player can set any price between 1g and the current max.
- Both totals are recalculated at the start of each shop phase to reflect permanent buffs gained during the previous action phase.
- **Haggle** sales add +3g on top of the set price (per-hireling modifier; not in the pricing panel).

### Stock effect on customer purchases

Stock determines how many units a customer purchases per interaction:

| Stock | Units / interaction |
| --- | --- |
| 1–5 | 1 |
| 6–15 | 1–2 |
| 16–30 | 2–3 |
| 31+ | 3–4 |

- Each unit reduces stock by 1 and generates gold equal to the current price.
- A hireling that runs out of stock mid-action stops selling but continues casting abilities.

## Shop Rules

- **Spell frequency:** at most **1 spell per shop refresh** across all general and guild-specific spells combined. Merlin's Academy (when implemented) overrides this and can produce additional spells via hireling abilities.

## Customers (4-Axis Tug-of-War)

Each customer is influenced by four axes; each side fills bars toward winning the customer. Every customer spawns with their **own randomized priority order** of the four axes — the first axis carries the most sway in the purchase decision, the last carries the least. The UI displays bars in priority order with pip indicators (★★★★ for the top axis down to ★ for the bottom).

### Weighted decision
Each axis is worth points equal to its priority weight. Default weights are `[4, 3, 2, 1]` — top axis is 4× the bottom. The side with the higher **weighted lead score** wins the customer.

- Leading the top axis alone (4) beats an opponent who leads any two of the lower three axes.
- Leading the top axis alone (4) loses to an opponent who leads the other three (3 + 2 + 1 = 6).
- Tied scores fall back to axis priority — the first-listed axis with a leader decides.

### Axes

- **Focus** — which side has the customer's attention. **Bewitch** = bursts of focus. Passive hirelings bleed focus toward your side just by existing.
- **Type** — binary. You either have the potion or you don't. If only one side does, that side has a massive advantage and the customer may abandon their preference.
- **Budget** — single gold value. Your set price either fits or it doesn't. **Haggle** pushes above it at reputation cost. Passive hirelings contribute their set price slowly against the budget bar.
- **Quality** — driven by potency. Customers have a minimum threshold; higher potency fills the quality bar faster.

### Passive hireling natural leans
- **Stock** → Focus (well-stocked stall draws attention).
- **Potency** → Quality (good product speaks for itself).
- **Set price** → Budget (always visible).
- **Potion type** → Type (binary; fills it or doesn't).

### Casting hirelings
- A cast bursts only the specific axes its action targets, not all four.

### Patience & reputation
- Each customer has a visible **patience timer** for how long they'll stay before purchasing.
- Customers carry a reputation ranking of **1–5 stars**. Successful sales grant the player that many stars of reputation.

## Charmed Hirelings

### Trigger
- Owning **3 copies of the same hireling with the same potion type** simultaneously — across board, bench, or hand in any combination — instantly merges them into one **Charmed** hireling.

### Merge behaviour
- All 3 copies combine instantly when the third is acquired.
- The Charmed hireling goes directly into the player's hand (one hand slot).
- Stats summed: Stock, Potency, and any permanent buffs.
- Cast time = base hireling's cast time.
- Potion type = the matching potion type.
- The 3 consumed copies are permanently removed from the pool. The Charmed hireling itself is **not** in the pool. If sold, it disappears permanently.

### Charm Card
When a Charmed hireling is **played onto the board**, the player receives one random Charm card directly into their hand. Charm cards are one-time-use spells, playable at any point during the shop phase. Current charms:

- **Tip Jar Charm** — Gain +3 gold.
- **Second Chance Charm** — Refresh the shop for free.
- **Lucky Charm** — Give a friendly hireling +3 permanent potency.

### Visual
Charmed hirelings have a sparkling/glowing border, with **"Third Time's the Charm!"** displayed briefly when the merge fires.

## Hover Tooltips

When hovering over a hireling, every keyword on that hireling must be defined at the bottom of the tooltip (multiple keywords = multiple definitions).

## Export to Excel (Admin tool, temporary)

A temporary **Export to Excel** button on the home page exports all hireling and spell data in the structured format below. Visible to all users for now; will later be moved to an admin-only area.

Hireling row columns: `Guild, Name, Wage Tier, Round Available, Pool Count, Potion 1 Stock, Potion 1 Potency, Potion 2 Stock, Potion 2 Potency, Cast Time, Keywords, Ability Text`.

## Versioning

Patch notes are tracked in `src/patch-notes.ts`. Versions follow `V0.0.X-alpha` format, incrementing to 100 before becoming `V0.1.0-alpha`.

**Patch-notes discipline — update BEFORE every commit.** Any commit that touches the engine, the UI, or gameplay rules must prepend a new entry at the top of the `PATCH_NOTES` array in `src/patch-notes.ts`. `npm run gen-notes` regenerates `docs/patch-notes.json`, which the title screen fetches at boot — the bundle script also runs this automatically, so `node scripts/bundle-browser.js` keeps the in-app changelog synchronized with `src/patch-notes.ts`. Pure test-only, internal-docs, or README-only commits can skip the entry.

## 11-Phase Rollout Plan (complete)

The core game build was split into 11 bite-sized phases, all shipped:

1. **Core Data & Keywords** — load card CSV, define all keywords.
2. **Economy System** — gold, wages, payday escalation.
3. **Board & Hand Layout** — 7 board slots, bench, hand UI.
4. **Shop System** — pool management, potion assignment, Spring Cleaning.
5. **Potion Pricing** — pricing panel, brackets, stock effects.
6. **Customer System** — 4-axis tug-of-war, patience timers.
7. **Action Round** — auto-battler combat, weather events.
8. **Opponent System** — async ghost opponent.
9. **Charmed Hireling** — merge mechanic, charm cards.
10. **Round Structure** — full 15-round game loop.
11. **Export Button** — admin tool.

## 13-Phase Rollout Plan — Part 2

The second rollout fills in mechanics and hirelings that the core build stubbed or skipped. Same rule as Part 1: one phase per session, patch notes updated on completion.

1. **Bewitch primitive** — focus-axis burst + per-customer focus lock (max 2 at once). Wire the simple cases: Candied Witch (Bewitch one customer), Queen's Bewitch clause, Masked Minstrel primary.
2. **Bewitch-reactive hirelings** — on top of Phase 1. Wire Lady's Maid (random ally +1 pot), Knight Errant (+3 pot if 3+ stars), Champion Knight (Nobles +2 pot), Prince (+3 self / +1 Nobles), Part-Time Potioneer (+2 pot), Squire (copy Knight Errant), Masked Minstrel (+3 stock if bought).
3. **Sabotage primitive** — opponent cast-time mutation (+Ns to an opponent hireling until round end). Wire direct cards: Sticky Fingers (lowest opp cast), Saboteur, Highwayman's Sabotage keyword.
4. **Sabotage-reactive hirelings** — on top of Phase 3. Wire Snitch Witch (+1 stock per ally Sabotage), Royal Advisor (Sabotage Nobles → +2 all stats), Batter Boy (+3 temp stock per opp Sabotage on you), Frosted Lookout (copy highest-pot Sugar's ability), Prince of Thieves (curse opp +3s cast).
5. **Dual-potion data model** — `HirelingInstance` gains `potionType2`, `permanentStockBonus2`, `permanentPotencyBonus2`. `HirelingActionState` gains per-slot stock/sold/temp. Sales pick the matching slot. UI shows two potion labels per card.
6. **Buff-event bus** — engine-level "permanent buff occurred" stream. Wire the reactive chains: Candy Architect (+2 Quickcraft per Sugar pot-buff), Court Scribe (last buff +1), Grand Vizier (copy last buff to self), Court Jester (+1 temp on any ally buff).
7. **Action-phase targeting UI** — let the player pick a target mid-battle (or at round-start). Wire Royal Tutor (pick one ally, next action +1 all stats), Kingmaker (Nobles pot doubled), Tower Escapee (random or picked active, −1s cast this round).
8. **Cross-player opponent effects** — engine hooks for cards that read/mutate opponent state beyond passive axes. Wire Robbin Goblin (steal +1 stock from opp lowest pot), Miss Fortune Teller (shop-start, +1 stock per customer opp won), Puss in Boots (steal 1 star from each customer).
9. **Ambiguous abilities (design calls needed)** — wire Spare Charming (haggle-fail detection), Sugar Rush Peddler (running cast-time reduction), Muffin Man (permanent keyword-count bump), Grand Thief (trigger Knockoff outside sale), Tasting Table (customer redirection). Each may require a quick design clarification.
10. **Weather effects** — currently just a placeholder with duration decay. Design 3–5 weather events (e.g. Rain → +1 price for Luck, Heatwave → −1s cast for Sugar) and wire axis / cast-time / stock deltas.
11. **Map system** — each map has a fixed 5-of-7 potion set instead of the current random selection. Map picker UI on game start.
12. **Polish pass** — missing potion flavor text for Luck / Half-Curse / Flutterfix, audio cues for cast / sale / payday, cast-fire animation pulse, admin-only gate on the Export button.
13. **Persistent leaderboard** — replace the session-only save with localStorage or a simple backend; pull-to-refresh on the leaderboard screen.

When picking up a phase, keep the change surface scoped to that phase only and update patch notes on completion.

## Code Conventions

- Deep copy card objects when creating instances to avoid shared mutable state.
- All card IDs use kebab-case (e.g. `"dusty-broom"`).
- Guilds: `Sugar Guild`, `Thieves Guild`, `Nobles Guild`, `No Guild`, `Spell`.
- Wage tiers: `Low`, `Medium`, `High`, `None`.
- Card data lives in `src/data/cards.csv`. New hirelings/spells go there first; the loader is responsible for parsing them into runtime objects.
