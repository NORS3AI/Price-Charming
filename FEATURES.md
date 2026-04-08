# Features

Comprehensive feature list for Price Charming. Status indicators: Implemented, Planned, Designed.

---

## Cards

### Hirelings — Implemented (partial)
- Carry 1-3 potions each
- Belong to a tribe (royalty, woodland, enchanted, mischief, culinary)
- Have unique traits, abilities, and synergies
- Tier 1, 2, and 3 variants
- Some are transformable via spells

### Assistants — Designed
- Do NOT carry potions
- Help make and stock potions for hirelings
- More effective at increasing stock than spells

### Spells — Implemented (partial)
- Buff potion potency
- Transform hirelings (Wishing Star)
- Decrease cast timers
- Protect hirelings (e.g. Magic Bubble: protect a hireling from sabotage)

### Rares — Designed
- Available only after round 7+
- Unique and powerful effects
- Example: Crazy Alchemist — creates Irresistible Potion (automatically attracts and sells to the next customer)

---

## Spell: Wishing Star — Implemented
- Transforms transformable hirelings
- Player chooses from two transformation options
- Current transformations:
  - Hag → Evil Royal or Poison Queen
  - Frog → Royal Fly Catch or Wart Covered Prince
  - Hidden Princess → Snow White or Master Pie Maker

## Transformation System — Implemented
- Registry-based: maps source hireling to two outcomes
- Extensible via `registerTransformation()`
- Deep copies produced to avoid shared state
- Transformed cards are higher tier with more potion slots

## Upgrade System — Designed
- 3 identical cards automatically upgrade into one new, better card
- Examples:
  - Little Piggy x3 → Big Bad Wolf
  - Teacups x3 → Madame Teapot
  - Simple Wish x3 → Magic Genie (spell; does nothing unless you have 3)

---

## Potion System — Designed

### Stock
- Each potion on each hireling has its own stock amount
- Stock can be increased via spells or assistants (assistants are more effective)

### Potency
- Each potion on each hireling has its own potency ranking
- Potency can be increased via spells and hireling interactions

---

## Game Flow — Designed

### Rounds
- 15 rounds maximum
- If the last round is a tie, a rare tie-breaker customer is summoned (Merlin, King Arthur, Queen of Hearts, etc.)

### Shop
- Shopkeeper: Fairy Godmother
- Rounds 1-3: low tier cards
- Rounds 4-6: medium tier cards
- Rounds 7+: high tier cards

### Timed Abilities
- Hirelings and assistants cast automatically during battle phase
- Each indicates how many seconds until their action triggers
- Spells and synergy can decrease cast times

### Reputation (Win/Lose)
- Begin each level at 0 reputation
- Win by maxing out reputation; lose by hitting the floor
- Normal rep bar: -30 to 0 to 30
- Round 13 crunch: -25 to 0 to 25
- Round 14 crunch: -20 to 0 to 20
- Round 15 crunch: -15 to 0 to 15
- If a player is below the crunch threshold, it crunches once and gives them one more round

### Win vs Continue
- Win a level early (e.g. round 7) and choose to continue
- Continuing forfeits that win; goal becomes reaching round 15
- Only round 15 snapshots can be uploaded as Champion Builds

---

## Opponents & Snapshots — Designed

### Snapshot System
- Opponents are based on snapshots of real players' builds at the same round/level

### Champion Snapshots
- Pin a strong round 15 build to the Champion Board
- Must meet certain criteria to qualify for the top 25
- Challengers get 3 attempts to beat it
- Stats tracked: wins vs challengers, losses vs challengers
- Most recent winner shown next to the Champion Snapshot
- Champion board updates weekly

---

## Caravans / Hero Powers — Designed
- Choose from 2 of 4 caravan types at the start of a round
- 2 unlocked by default; unlock others with Crowns
- Each caravan has a unique passive ability
- Examples: Elephant, Basic Carriage, Magic Carpet, Broom Sticks

---

## Currency — Designed

### Coins
- Earned by selling potions
- Spent in the shop: refreshing the shop, buying hirelings and spells

### Crowns
- Premium/pay-for token
- Used to unlock additional caravan options

---

## Events — Designed
- Occur at transition rounds (when higher tier hirelings enter the pool)
- Trigger at Tier 4 and Tier 8 transitions
- Examples: Loan Shark, GambleBees

---

## Weather — Designed
- Dynamic weather effects during rounds
- Examples: Frog Fog, Spell-made Lightning

---

## Levels & Game Modes — Designed

### Story Mode
- 7-10 levels on a general map
- Locations: King's Courtyard, Royal Suburbs, Bureau of Oddjobs for Outcasts (BOO), Fairy Garden Glen, Thieves Corner, etc.
- Each level has 4 difficulty settings: Easy, Medium, Hard, Nightmare

### Competitive Mode
- Dive straight into a game with random levels/zones
- Difficulty auto-detected based on first few games

### Champion Battles
- Battle the top 25 Champion Snapshots

### Friend Battles
- Battle friends' Champion Snapshots

---

## Cosmetics — Designed

### Titles
- Earned by meeting criteria (winning rare customers, max reputation at round 15, etc.)
- Example: "Chant the Royal Charmer"

### Characters
- Choose a profile character (bust image)
- Upgradeable: static → motion
- Options:
  - Prince Charming
  - Princess Charming
  - Gingerbread Cookie
  - Miss Muffet
  - Boy Who Cried Wolf
  - Ugly Duckling
  - The 8th Dwarf
  - Wicked Witch

---

## Names & Flags — Designed
- Players choose a user name and shop name
- Inappropriate names flagged by the system revert to defaults when used as opponents or on the Champion Board

---

## Patch Notes System — Implemented
- Tracked in `src/patch-notes.ts`
- Versioning: V0.0.X-alpha (increments to 100, then V0.1.0-alpha)
- Viewable on the GitHub Pages site
