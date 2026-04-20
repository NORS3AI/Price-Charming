# Price Charming

A fairy-tale themed auto-battler card game where you run a potion shop, hire enchanted workers, and outsell your rivals.

## Play the Game

**[Play Price Charming](https://nors3ai.github.io/Price-Charming/)**

## About

Welcome to the enchanted marketplace! You are a potion shop owner travelling through fairy-tale lands — from the King's Courtyard to the Fairy Garden Glen. Hire magical creatures, brew powerful potions, and charm every customer that walks through your door.

### How It Works

Each game lasts up to **15 rounds**. Every round is split into two phases:

- **Shop Phase** — buy hirelings and spells from the **Fairy Godmother's shop**, refresh, set potion prices, and arrange your board.
- **Action Phase** — the marketplace opens. Hirelings auto-cast on timers and sell to customers in a 4-axis tug-of-war for Focus, Type, Budget, and Quality.

You start with **5 gold** and a free **Dusty Broom** pre-placed on your board. Hirelings live in 7 slots — 5 active, 2 bench. Bench hirelings rest but still owe wages.

### Guilds & Keywords

Hirelings belong to one of four guilds — **Sugar**, **Thieves**, **Nobles**, or **No Guild** — and may carry these keywords:

- **Sabotage** — slow an opponent's hireling.
- **Bewitch** — pull a customer's focus to your side.
- **Knockoff xN** — gain permanent stock after low-potency sales.
- **Haggle** — sell at +3g for −1 reputation per sale.
- **Quickcraft xN** — generate temporary stock each cast.

### Charmed Hirelings

Collect **3 copies of the same hireling with the same potion type** — across board, bench, or hand — and they merge instantly into a **Charmed** hireling. Playing a Charmed onto the board grants a random **Charm card** (Tip Jar, Second Chance, or Lucky).

### Payday

Wages come due on rounds **3, 6, 9, 12, 15**. Every hireling — bench included — must be paid or sold, and wages climb +2g for each payday a hireling survives.

### Win Condition

Max out your reputation bar to win. Lose all reputation and you're out. In the final rounds (13–15) the reputation bar **crunches**, making every sale count even more.

### Game Modes

- **Story Mode** — Progress through 7-10 fairy-tale levels on Easy, Medium, Hard, or Nightmare difficulty.
- **Competitive** — Random levels with auto-detected difficulty based on your performance.
- **Champion Battles** — Challenge the top 25 Champion Snapshots on the weekly leaderboard.
- **Friend Battles** — Battle your friends' Champion Snapshots.

## Development

```bash
npm install
npm test
npm run build
```

> **Note:** The card system is currently being rebuilt. All previously coded hirelings, spells, transformations, and upgrades have been cleared. Phase 1 will rebuild the registry from `src/data/cards.csv`.

## Rollout Plan

The full game is being built in 11 phases, each scoped to fit in a single session:

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

## Documentation

- [Features List](FEATURES.md)
- [Patch Notes](https://nors3ai.github.io/Price-Charming/#patch-notes)

## License

All rights reserved.
