import { HirelingCard, SpellCard } from "../cards/types";
import {
  getTransformationChoices,
  isTransformable,
  TransformationChoice,
} from "./transformations";

/** The Wishing Star spell card definition. */
export const WishingStar: SpellCard = {
  id: "wishing-star",
  name: "Wishing Star",
  kind: "spell",
  tier: 1,
  description:
    "Transforms a transformable hireling. Choose one of two possible transformations.",
};

/** Possible outcomes when casting Wishing Star. */
export type CastResult =
  | { success: true; choices: TransformationChoice; target: HirelingCard }
  | { success: false; reason: string };

/**
 * Attempt to cast Wishing Star on a target hireling.
 *
 * If the target is transformable, returns the two transformation choices for
 * the player to pick from. The caller (UI / game loop) is responsible for
 * presenting the choice and calling `applyTransformation` with the selection.
 */
export function castWishingStar(target: HirelingCard): CastResult {
  if (!target.transformable) {
    return {
      success: false,
      reason: `${target.name} is not transformable.`,
    };
  }

  if (!isTransformable(target)) {
    return {
      success: false,
      reason: `${target.name} has no registered transformation paths.`,
    };
  }

  const choices = getTransformationChoices(target)!;

  return { success: true, choices, target };
}

/** The player's selection when choosing a transformation. */
export type TransformPick = "A" | "B";

/**
 * Apply the player's chosen transformation, returning the new hireling that
 * replaces the original on the board.
 *
 * The returned hireling is a fresh copy so it doesn't share mutable state
 * with the template.
 */
export function applyTransformation(
  choices: TransformationChoice,
  pick: TransformPick
): HirelingCard {
  const selected = pick === "A" ? choices.optionA : choices.optionB;

  // Return a deep copy so each transformed hireling is independent.
  return {
    ...selected,
    potions: selected.potions.map((p) => ({ ...p })),
  };
}
