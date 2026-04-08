// Card types
export type {
  Card,
  HirelingCard,
  AssistantCard,
  SpellCard,
  PotionSlot,
  Tier,
  CardKind,
  Tribe,
  BaseCard,
} from "./cards/types";

// Hireling definitions
export {
  Hag,
  Frog,
  HiddenPrincess,
  EvilRoyal,
  PoisonQueen,
  RoyalFlyCatch,
  WartCoveredPrince,
  SnowWhite,
  MasterPieMaker,
  ALL_HIRELINGS,
} from "./cards/hirelings";

// Transformation system
export {
  getTransformationChoices,
  isTransformable,
  registerTransformation,
} from "./spells/transformations";
export type { TransformationChoice } from "./spells/transformations";

// Wishing Star spell
export {
  WishingStar,
  castWishingStar,
  applyTransformation,
} from "./spells/wishing-star";
export type { CastResult, TransformPick } from "./spells/wishing-star";
