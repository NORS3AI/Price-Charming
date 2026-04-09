import {
  hasUpgrade,
  getUpgradeResult,
  applyUpgrade,
} from "../spells/upgrades";
import {
  LittlePiggy,
  Teacups,
  BigBadWolf,
  MadameTeapot,
  Hag,
} from "../cards/hirelings";
import { HirelingCard } from "../cards/types";

function copy(c: HirelingCard): HirelingCard {
  return { ...c, potions: c.potions.map((p) => ({ ...p })) };
}

describe("Upgrade system", () => {
  describe("hasUpgrade", () => {
    it("returns true for Little Piggy", () => {
      expect(hasUpgrade(LittlePiggy)).toBe(true);
    });

    it("returns true for Teacups", () => {
      expect(hasUpgrade(Teacups)).toBe(true);
    });

    it("returns false for non-upgradeable hirelings", () => {
      expect(hasUpgrade(Hag)).toBe(false);
    });
  });

  describe("getUpgradeResult", () => {
    it("Little Piggy upgrades to Big Bad Wolf", () => {
      const result = getUpgradeResult(LittlePiggy);
      expect(result).toBeDefined();
      expect(result!.id).toBe("big-bad-wolf");
      expect(result!.name).toBe("Big Bad Wolf");
    });

    it("Teacups upgrades to Madame Teapot", () => {
      const result = getUpgradeResult(Teacups);
      expect(result).toBeDefined();
      expect(result!.id).toBe("madame-teapot");
      expect(result!.name).toBe("Madame Teapot");
    });

    it("returns undefined for non-upgradeable hirelings", () => {
      expect(getUpgradeResult(Hag)).toBeUndefined();
    });
  });

  describe("applyUpgrade", () => {
    it("merges 3 Little Piggys into Big Bad Wolf", () => {
      const board = [copy(LittlePiggy), copy(LittlePiggy), copy(LittlePiggy)];
      const { board: newBoard, upgraded } = applyUpgrade(board);
      expect(newBoard).toHaveLength(1);
      expect(newBoard[0].id).toBe("big-bad-wolf");
      expect(upgraded).not.toBeNull();
      expect(upgraded!.id).toBe("big-bad-wolf");
    });

    it("merges 3 Teacups into Madame Teapot", () => {
      const board = [copy(Teacups), copy(Teacups), copy(Teacups)];
      const { board: newBoard, upgraded } = applyUpgrade(board);
      expect(newBoard).toHaveLength(1);
      expect(newBoard[0].id).toBe("madame-teapot");
      expect(upgraded!.id).toBe("madame-teapot");
    });

    it("does not upgrade when fewer than 3 copies", () => {
      const board = [copy(LittlePiggy), copy(LittlePiggy)];
      const { board: newBoard, upgraded } = applyUpgrade(board);
      expect(newBoard).toHaveLength(2);
      expect(upgraded).toBeNull();
    });

    it("preserves other hirelings on the board", () => {
      const board = [
        copy(Hag),
        copy(LittlePiggy),
        copy(LittlePiggy),
        copy(LittlePiggy),
      ];
      const { board: newBoard, upgraded } = applyUpgrade(board);
      expect(newBoard).toHaveLength(2);
      expect(newBoard[0].id).toBe("hag");
      expect(newBoard[1].id).toBe("big-bad-wolf");
      expect(upgraded!.id).toBe("big-bad-wolf");
    });

    it("does not upgrade non-upgradeable triples", () => {
      const board = [copy(Hag), copy(Hag), copy(Hag)];
      const { board: newBoard, upgraded } = applyUpgrade(board);
      expect(newBoard).toHaveLength(3);
      expect(upgraded).toBeNull();
    });

    it("upgraded card is a deep copy", () => {
      const board = [copy(LittlePiggy), copy(LittlePiggy), copy(LittlePiggy)];
      const { board: newBoard } = applyUpgrade(board);
      newBoard[0].potions[0].stock = 999;
      expect(BigBadWolf.potions[0].stock).not.toBe(999);
    });

    it("upgraded card is higher tier", () => {
      const board = [copy(LittlePiggy), copy(LittlePiggy), copy(LittlePiggy)];
      const { board: newBoard } = applyUpgrade(board);
      expect(newBoard[0].tier).toBeGreaterThan(LittlePiggy.tier);
    });

    it("upgraded card has more potions", () => {
      const board = [copy(Teacups), copy(Teacups), copy(Teacups)];
      const { board: newBoard } = applyUpgrade(board);
      expect(newBoard[0].potions.length).toBeGreaterThan(
        Teacups.potions.length
      );
    });
  });
});
