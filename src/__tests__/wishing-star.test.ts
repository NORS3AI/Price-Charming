import {
  castWishingStar,
  applyTransformation,
  WishingStar,
} from "../spells/wishing-star";
import {
  isTransformable,
  getTransformationChoices,
} from "../spells/transformations";
import {
  Hag,
  Frog,
  HiddenPrincess,
  EvilRoyal,
  PoisonQueen,
  RoyalFlyCatch,
  WartCoveredPrince,
  SnowWhite,
  MasterPieMaker,
} from "../cards/hirelings";

describe("Wishing Star spell", () => {
  describe("spell card definition", () => {
    it("is a spell card", () => {
      expect(WishingStar.kind).toBe("spell");
    });

    it("has the correct name", () => {
      expect(WishingStar.name).toBe("Wishing Star");
    });
  });

  describe("isTransformable", () => {
    it("returns true for transformable hirelings with registered paths", () => {
      expect(isTransformable(Hag)).toBe(true);
      expect(isTransformable(Frog)).toBe(true);
      expect(isTransformable(HiddenPrincess)).toBe(true);
    });

    it("returns false for non-transformable hirelings", () => {
      expect(isTransformable(EvilRoyal)).toBe(false);
      expect(isTransformable(SnowWhite)).toBe(false);
    });
  });

  describe("getTransformationChoices", () => {
    it("returns two choices for Hag: Evil Royal or Poison Queen", () => {
      const choices = getTransformationChoices(Hag);
      expect(choices).toBeDefined();
      expect(choices!.optionA.id).toBe("evil-royal");
      expect(choices!.optionB.id).toBe("poison-queen");
    });

    it("returns two choices for Frog: Royal Fly Catch or Wart Covered Prince", () => {
      const choices = getTransformationChoices(Frog);
      expect(choices).toBeDefined();
      expect(choices!.optionA.id).toBe("royal-fly-catch");
      expect(choices!.optionB.id).toBe("wart-covered-prince");
    });

    it("returns two choices for Hidden Princess: Snow White or Master Pie Maker", () => {
      const choices = getTransformationChoices(HiddenPrincess);
      expect(choices).toBeDefined();
      expect(choices!.optionA.id).toBe("snow-white");
      expect(choices!.optionB.id).toBe("master-pie-maker");
    });

    it("returns undefined for non-transformable hirelings", () => {
      expect(getTransformationChoices(EvilRoyal)).toBeUndefined();
    });
  });

  describe("castWishingStar", () => {
    it("succeeds on a transformable hireling and returns choices", () => {
      const result = castWishingStar(Hag);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.target.id).toBe("hag");
        expect(result.choices.optionA.name).toBe("Evil Royal");
        expect(result.choices.optionB.name).toBe("Poison Queen");
      }
    });

    it("fails on a non-transformable hireling", () => {
      const result = castWishingStar(EvilRoyal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toContain("not transformable");
      }
    });
  });

  describe("applyTransformation", () => {
    it("returns option A when player picks A", () => {
      const choices = getTransformationChoices(Hag)!;
      const result = applyTransformation(choices, "A");
      expect(result.id).toBe("evil-royal");
      expect(result.name).toBe("Evil Royal");
      expect(result.tier).toBe(2);
    });

    it("returns option B when player picks B", () => {
      const choices = getTransformationChoices(Hag)!;
      const result = applyTransformation(choices, "B");
      expect(result.id).toBe("poison-queen");
      expect(result.name).toBe("Poison Queen");
    });

    it("returns a deep copy so mutations don't affect the template", () => {
      const choices = getTransformationChoices(Frog)!;
      const transformed = applyTransformation(choices, "A");

      // Mutate the copy
      transformed.potions[0].stock = 999;

      // Original template should be unaffected
      expect(RoyalFlyCatch.potions[0].stock).not.toBe(999);
    });

    it("transforms Frog into Royal Fly Catch (A) or Wart Covered Prince (B)", () => {
      const choices = getTransformationChoices(Frog)!;
      expect(applyTransformation(choices, "A").name).toBe("Royal Fly Catch");
      expect(applyTransformation(choices, "B").name).toBe("Wart Covered Prince");
    });

    it("transforms Hidden Princess into Snow White (A) or Master Pie Maker (B)", () => {
      const choices = getTransformationChoices(HiddenPrincess)!;
      expect(applyTransformation(choices, "A").name).toBe("Snow White");
      expect(applyTransformation(choices, "B").name).toBe("Master Pie Maker");
    });

    it("transformed hirelings have more potion slots than their source", () => {
      const choices = getTransformationChoices(Hag)!;
      const resultA = applyTransformation(choices, "A");
      const resultB = applyTransformation(choices, "B");

      // Hag has 1 potion slot; transformations should have 2+
      expect(resultA.potions.length).toBeGreaterThan(Hag.potions.length);
      expect(resultB.potions.length).toBeGreaterThan(Hag.potions.length);
    });

    it("transformed hirelings are higher tier than their source", () => {
      const choices = getTransformationChoices(Frog)!;
      const resultA = applyTransformation(choices, "A");
      expect(resultA.tier).toBeGreaterThan(Frog.tier);
    });
  });
});
