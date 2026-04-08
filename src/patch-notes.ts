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
