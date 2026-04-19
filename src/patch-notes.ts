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
    version: "V0.1.5-alpha",
    date: "2026-04-19",
    title: "11-Phase Rollout Plan",
    changes: [
      "Documented the 11-phase rollout plan in README.md, CLAUDE.md, and FEATURES.md.",
      "Phase 1: Core Data & Keywords — load card CSV, define all keywords.",
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
