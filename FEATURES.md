# Features

Comprehensive feature list for Price Charming. Status indicators: Implemented, Planned, Designed.

> **Reset notice:** All previously defined hireling and spell card data has been cleared. The card system is being rebuilt from scratch from `src/data/cards.csv`. Older "transformation" and "upgrade" systems are deprecated — Charmed Hirelings (3-of-a-kind merge) replace them.

---

## 11-Phase Rollout Plan — Planned

The full-game build is split into 11 small phases so each one fits inside a single working session.

1. **Core Data & Keywords** — load card CSV (`src/data/cards.csv`), define all keywords (Sabotage, Bewitch, Knockoff, Haggle, Quickcraft).
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

---

## Cards — Designed

### Hirelings
- Belong to a Guild: Sugar Guild, Thieves Guild, Nobles Guild, No Guild. (Merlin's Academy planned later.)
- Carry 1 or 2 potions, each with its own Stock and Potency.
- Have a Wage Tier (Low / Medium / High / None) and a Cast Time (or Passive).
- May carry one or more keywords. Star Rating (blank, ⭐, ⭐⭐) marks rarity.
- Loaded from `src/data/cards.csv`.

### Spells
- Bought from the shop into the player's hand. Cannot be sold.
- At most **1 spell per shop refresh** across all general and guild-specific spells (Merlin's Academy will override later).
- Charm cards are one-time-use spells granted only by playing a Charmed hireling.

---

## Keywords — Designed

| Keyword | Effect |
| --- | --- |
| Sabotage | +1s to one opponent hireling's cast time until end of action round (target = card-specified, default random). |
| Bewitch | Hireling gains customer Focus. Subsequent Bewitch can affect a 2nd customer simultaneously (max 2). |
| Knockoff xN | After this hireling sells, if its potency is below 10, gain +N permanent stock. |
| Haggle | Potions sold by this hireling are auto-priced 3g above the set price; each Haggle sale costs −1 reputation. |
| Quickcraft xN | Base stock is 0. After this hireling casts, gain +N temporary stock. Resets at start of each shop round. |

Only Knockoff, Haggle, and Quickcraft accept `xN` for now. Hirelings without a cast cannot have keywords. Hover tooltips list every keyword definition at the bottom.

Temporary stats (granted by abilities) revert when entering the shop phase — they're action-phase only.

---

## Hand & Board — Designed

### Hand
- Holds both hirelings and spells during the shop phase.
- Bottom-of-screen UI. Max **8 cards**.
- Purchases go directly to the hand. Full hand = no purchases until space frees.

### Playing & Selling
- **Play hireling:** drag from hand onto a board slot.
- **Sell from hand:** drag into the shop area.
- **Sell from board:** drag into the shop area.
- Spells cannot be sold.

### Board (7 slots)
- Slots 1 & 7 = Bench (dimmed). Don't cast or contribute passively. **Still pay wages.**
- Slots 2–6 = Active. Five hirelings participate in the action phase.
- Action phase hides the bench entirely — clean row of 5.

### Rearranging
- Click and drag any board hireling left/right during the shop phase. Locked during action phase.

---

## Economy — Designed

### Starting state
- 5 gold. Free **Dusty Broom** pre-placed in slot 4.

### Dusty Broom (starter)
- Guild None · Wage None (exempt from payday).
- 1 potion (random from active types) · Stock 5 · Potency 1 · Cast 5s.
- Cannot be Sabotaged or buffed.
- Sells for 1g; disappears permanently. Never in the card pool.

### Gold
- **Costs:** Hireling 4g · Spell 2g · Refresh 1g · Sell 1g.
- **Income:** only from potion sales during the action phase.
- Unspent gold rolls over. No floor beyond what hirelings sell.

### Payday
- Triggers at the start of shop rounds **3, 6, 9, 12, 15**.
- Glow-warning rounds: **2, 5, 8, 11, 14**.
- Per hireling: **Pay** the wage (gold deducted) or **Sell** (returns to pool, gain sell value). Insufficient gold greys out Pay.
- Bench hirelings included.

### Wage escalation (per hireling, +2g per payday survived)

| Payday # | Low | Medium | High |
| --- | --- | --- | --- |
| 1 | 2g | 4g | 6g |
| 2 | 4g | 6g | 8g |
| 3 | 6g | 8g | 10g |
| 4 | 8g | 10g | 12g |
| 5 | 10g | 12g | 14g |

- Tracked per hireling. Benching does not pause/reset. Selling resets nothing — repurchase starts at payday 1.
- Each hireling shows rounds-until-payday and current wage demand.

---

## Potion Types — Designed

Seven total: ❤️ Love Potion, 🔥 Dragon's Breath Tonic, 💧 Mermaid's Tears Elixir, 💰 Goblin's Greed Brew, 🍀 Luck Potion, 💀 Half-Curse Cure, 🪽 Flutterfix Tonic.

- 5 of 7 are randomly selected at the start of each game (equal probability). The other 2 are inactive that run.
- Future maps will have a fixed set of 5; the random selection is temporary.
- **Reshuffle** at the start of each shop phase across all hireling copies in the pool. Refreshing the shop does **not** reshuffle.
- **Discovery:** the player isn't told the active types. A hover panel in the shop UI lists only the types they've already encountered.

---

## Potion Pricing — Designed

- Set **per potion type**, not per hireling. Applies globally across all hirelings selling that type.
- Pricing panel shows icon, name, combined potency, current price, and `+X potency to next tier` or `Price cap reached`.

### Price brackets

| Combined Potency | Max Price |
| --- | --- |
| 1–8 | 1g |
| 9–16 | 2g |
| 17–24 | 3g |
| 25–32 | 4g |
| 33–40 | 5g |
| 41–50 | 6g |
| 51–62 | 7g |
| 63+ | 8g (cap) |

- Combined potency recomputes at the start of each shop phase.
- **Haggle** adds +3g per sale (per-hireling; not in the pricing panel).

### Stock effect on customer purchases

| Stock | Units / interaction |
| --- | --- |
| 1–5 | 1 |
| 6–15 | 1–2 |
| 16–30 | 2–3 |
| 31+ | 3–4 |

A hireling that runs out of stock mid-action stops selling but continues casting abilities.

---

## Customers — Designed

### 4-Axis tug-of-war
- **Focus** — Bewitch grants bursts; passive hirelings bleed focus toward your side.
- **Type** — binary; only one side has the potion or both do.
- **Budget** — one gold value; your set price either fits or it doesn't. Haggle pushes above it at reputation cost.
- **Quality** — driven by potency vs the customer's threshold.

Customers list these in their own order of importance. Casting hirelings burst only the axes their action targets; passive hirelings naturally lean by stat (Stock→Focus, Potency→Quality, Set Price→Budget, Potion Type→Type).

### Patience & reputation
- Each customer has a visible patience timer.
- Customers carry a 1–5 star reputation ranking; successful sales grant the player that many stars of reputation.

---

## Charmed Hirelings — Designed

### Trigger
3 copies of the same hireling **with the same potion type** across board, bench, or hand merge instantly.

### Merge behaviour
- Goes directly into the hand (one slot).
- Stats summed (Stock + Potency + permanent buffs).
- Cast time and potion type unchanged.
- The 3 consumed copies are permanently removed from the pool. Charmed hirelings are not in the pool. Selling a Charmed = gone forever.

### Charm Cards (one-time-use spells)
Granted to the hand when a Charmed hireling is played onto the board:
- **Tip Jar Charm** — Gain +3 gold.
- **Second Chance Charm** — Refresh the shop for free.
- **Lucky Charm** — Give a friendly hireling +3 permanent potency.

### Visual
Sparkling/glowing border. **"Third Time's the Charm!"** notification when the merge fires.

---

## Hover Tooltips — Designed
Every keyword on a hireling must be defined at the bottom of the hover-over (multiple keywords = multiple definitions).

---

## Shop & Spell Frequency — Designed
At most 1 spell per shop refresh across all general and guild-specific spells. Merlin's Academy (planned) is the only override.

---

## Export to Excel (Admin tool) — Planned
Temporary **Export to Excel** button on the home page exports all hireling and spell data in the structured format used by `src/data/cards.csv`. Visible to all users initially; will move to an admin-only area later. Hireling row columns: `Guild, Name, Wage Tier, Round Available, Pool Count, Potion 1 Stock, Potion 1 Potency, Potion 2 Stock, Potion 2 Potency, Cast Time, Keywords, Ability Text`.

---

## Game Flow — Designed

### Phases
- **Shop Phase** — buy/sell, refresh, play spells, set prices, arrange the board.
- **Action Phase** — marketplace opens; hirelings auto-cast and sell to customers.

### Rounds
- 15 rounds maximum.
- Reputation: -30/+30, with crunch in rounds 13 (-25/+25), 14 (-20/+20), 15 (-15/+15).
- Last-round tie summons a rare tie-breaker customer (Merlin, King Arthur, Queen of Hearts, etc.).

### Win vs Continue
- Win early (e.g. round 7) and choose to continue.
- Continuing forfeits that win; the goal becomes reaching round 15.
- Only round-15 snapshots can be uploaded as Champion Builds.

---

## Opponents & Snapshots — Designed
- Opponents are snapshots of real players' builds at the same round/level.
- Champion Snapshots: pin a strong round-15 build to the Champion Board. Top 25 weekly. 3 challenger attempts each. Stats tracked: wins/losses; most recent winner shown.

---

## Caravans / Hero Powers — Designed
- Choose 2 of 4 caravans at round start. 2 unlocked by default; the others unlock with Crowns. Each has a unique passive (Elephant, Basic Carriage, Magic Carpet, Broom Sticks).

---

## Currency — Designed
- **Coins / Gold** — earned through potion sales; spent in the shop.
- **Crowns** — premium token; unlocks additional caravans.

---

## Events — Designed
- Trigger at tier transitions (Tier 4 and Tier 8). Examples: Loan Shark, GambleBees.

---

## Weather — Designed
- Dynamic weather during action phases. Examples: Frog Fog, Spell-made Lightning.

---

## Levels & Game Modes — Designed

### Story Mode
- 7–10 levels: King's Courtyard, Royal Suburbs, Bureau of Oddjobs for Outcasts (BOO), Fairy Garden Glen, Thieves Corner, etc.
- Difficulty per level: Easy / Medium / Hard / Nightmare.

### Competitive Mode
- Random levels/zones; difficulty auto-detected from first few games.

### Champion Battles
- Battle the top 25 Champion Snapshots.

### Friend Battles
- Battle friends' Champion Snapshots.

---

## Cosmetics — Designed

### Titles
- Earned for criteria like winning rare customers or maxing reputation at round 15. Example: "Chant the Royal Charmer".

### Characters
- Profile bust image, upgradeable static → motion. Options: Prince Charming, Princess Charming, Gingerbread Cookie, Miss Muffet, Boy Who Cried Wolf, Ugly Duckling, The 8th Dwarf, Wicked Witch.

---

## Names & Flags — Designed
- Players choose a username and shop name. Inappropriate names flagged by the system revert to defaults when used as opponents or on the Champion Board.

---

## Patch Notes System — Implemented
- Tracked in `src/patch-notes.ts`.
- Versioning: V0.0.X-alpha (increments to 100, then V0.1.0-alpha).
- Viewable on the GitHub Pages site.
