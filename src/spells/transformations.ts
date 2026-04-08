import { HirelingCard } from "../cards/types";
import {
  EvilRoyal,
  PoisonQueen,
  Frog,
  RoyalFlyCatch,
  WartCoveredPrince,
  HiddenPrincess,
  SnowWhite,
  MasterPieMaker,
  Hag,
} from "../cards/hirelings";

/**
 * A transformation choice presented to the player when Wishing Star targets
 * a transformable hireling. The player picks one of the two options.
 */
export interface TransformationChoice {
  optionA: HirelingCard;
  optionB: HirelingCard;
}

/**
 * Registry mapping a transformable hireling's id to its two possible outcomes.
 * Only hirelings with `transformable: true` should appear here.
 */
const transformationRegistry = new Map<string, TransformationChoice>();

function register(source: HirelingCard, optionA: HirelingCard, optionB: HirelingCard) {
  if (!source.transformable) {
    throw new Error(`Cannot register transformation for non-transformable hireling: ${source.name}`);
  }
  transformationRegistry.set(source.id, { optionA, optionB });
}

// --- register the canonical transformations from the game design ---
register(Hag, EvilRoyal, PoisonQueen);
register(Frog, RoyalFlyCatch, WartCoveredPrince);
register(HiddenPrincess, SnowWhite, MasterPieMaker);

/**
 * Look up the two transformation options for a given hireling.
 * Returns `undefined` if the hireling has no registered transformation.
 */
export function getTransformationChoices(
  hireling: HirelingCard
): TransformationChoice | undefined {
  return transformationRegistry.get(hireling.id);
}

/**
 * Returns true if the hireling can be transformed by the Wishing Star spell.
 */
export function isTransformable(hireling: HirelingCard): boolean {
  return hireling.transformable && transformationRegistry.has(hireling.id);
}

/**
 * Register a new transformation path. Useful for extending the game with
 * new transformable hirelings.
 */
export function registerTransformation(
  source: HirelingCard,
  optionA: HirelingCard,
  optionB: HirelingCard
): void {
  register(source, optionA, optionB);
}
