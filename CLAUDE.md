# CLAUDE.md

## Project Overview

**Price Charming** is a fairy-tale themed auto-battler card game. Players run a potion shop using hirelings, assistants, and spells to brew and sell potions to customers. Opponents are snapshot-based — you compete against recordings of other players' builds at the same round.

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
    types.ts        — Card type system (HirelingCard, SpellCard, AssistantCard)
    hirelings.ts    — All hireling card definitions
  spells/
    transformations.ts — Transformation registry (maps transformable cards to outcomes)
    wishing-star.ts    — Wishing Star spell implementation
  patch-notes.ts  — Versioned patch notes data
  index.ts        — Public API exports
docs/
  index.html      — GitHub Pages site
```

## Key Concepts

- **Hirelings** carry 1-3 potions, belong to a tribe, and may be transformable.
- **Assistants** help stock/brew potions but don't carry them.
- **Spells** apply effects: buff potency, transform hirelings, decrease timers, protect.
- **Transformations** turn a low-tier hireling into one of two higher-tier options (player chooses).
- **Upgrades** combine 3 identical cards into one better card (not yet implemented).

## Versioning

Patch notes are tracked in `src/patch-notes.ts`. Versions follow `V0.0.X-alpha` format, incrementing to 100 before becoming `V0.1.0-alpha`.

## 11-Phase Rollout Plan

The full-game build is split into 11 bite-sized phases. Each phase is small enough to complete in a single session without timing out.

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

When picking up a phase, keep the change surface scoped to that phase only and update patch notes on completion.

## Code Conventions

- Deep copy card objects when creating instances to avoid shared mutable state.
- Register new transformable hirelings in `src/spells/transformations.ts`.
- All card IDs use kebab-case (e.g. `"hidden-princess"`).
- Tribes: `royalty`, `woodland`, `enchanted`, `mischief`, `culinary`.
- Tiers: 1 (rounds 1-3), 2 (rounds 4-6), 3 (rounds 7+).
