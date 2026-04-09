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
