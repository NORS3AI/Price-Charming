import { ALL_HIRELINGS } from "../cards/hirelings";
import { createBoard, placeHireling } from "../board/board";
import { createHirelingInstance } from "../board/hand";
import { Board } from "../board/types";
import { mulberry32 } from "../potions/rng";
import { PotionTypeId } from "../potions/types";
import { defaultPriceMap } from "../pricing/panel";
import { initializeActionState, tick } from "../action/state";

const ACTIVE: readonly PotionTypeId[] = [
  "love",
  "luck",
  "flutterfix",
  "dragons-breath",
  "goblins-greed",
];

function placeAt(b: Board, slot: number, name: string, potion: PotionTypeId): Board {
  const card = ALL_HIRELINGS.find((h) => h.name === name)!;
  return placeHireling(b, slot, createHirelingInstance(card, `${name}-${slot}`, potion));
}

describe("Buff-event bus (Phase 6)", () => {
  test("Court Jester gains +1 temp stock per ally permanent stock buff", () => {
    // Lord Chamberlain (7s cast) buffs Nobles allies +1 stock +1 pot.
    // Court Jester is Nobles, so it gets buffed AND fires reactive
    // (if the reactive fired on its own gain — but the hook excludes
    // self). Add a third Noble (Lady's Maid) so Lord Chamberlain
    // ALSO buffs HER, and the Jester reacts to those.
    let b = createBoard();
    b = placeAt(b, 1, "Lady's Maid", "love");
    b = placeAt(b, 3, "Court Jester", "love");
    b = placeAt(b, 5, "Lord Chamberlain", "love"); // 7s cast
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = tick(s, 8, mulberry32(1)); // one cast at 7s
    const jester = s.hirelingStates.get("Court Jester-3")!;
    // Lord Chamberlain buffed Lady's Maid AND Court Jester (both Nobles).
    // Jester reacted to Lady's Maid's buff (+1 stock +1 pot), gaining
    // +1 temp stock and +1 perm pot this round. Lord Chamberlain ALSO
    // buffed Jester directly, but the reactive hook skips self-events.
    expect(jester.temporaryStock).toBeGreaterThanOrEqual(1);
    expect(jester.permanentPotencyGainedThisRound).toBeGreaterThanOrEqual(1);
  });

  test("The Grand Vizier copies the last permanent buff any ally received", () => {
    // Set up: Sugar Sprinkler + Grand Vizier + a target ally so the
    // Sprinkler's adjacent buff lands first (giving Vizier a buff to
    // copy) and Vizier casts after.
    // Sugar Sprinkler 5s cast → buffs adjacent allies +1 potency.
    // Grand Vizier 7s cast (decreasing) — first cast at 7s.
    let b = createBoard();
    b = placeAt(b, 1, "Doughboy", "love");          // adjacent to Sprinkler — gets +1 pot
    b = placeAt(b, 2, "Sugar Sprinkler", "love");
    b = placeAt(b, 3, "The Grand Vizier", "love");
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    // Tick 8s — Sprinkler casts at 5s (buffs Doughboy +1 pot, also
    // tries to buff Vizier on the right but Vizier isn't adjacent at
    // slot 3 — wait, Sprinkler is at slot 2, Doughboy at 1, Vizier
    // at 3, so both are adjacent). Vizier casts at 7s: copies the
    // last ability-buff (which was on Doughboy or Vizier, +0/+1).
    s = tick(s, 8, mulberry32(1));
    const vizier = s.hirelingStates.get("The Grand Vizier-3")!;
    // Vizier should have copied the +1 potency buff to himself. Plus
    // any potency he was buffed with directly (+1 from Sprinkler).
    expect(vizier.permanentPotencyGainedThisRound).toBeGreaterThanOrEqual(2);
  });

  test("Court Scribe amplifies the most recent permanent buff by +1 on its own cast", () => {
    let b = createBoard();
    b = placeAt(b, 1, "Doughboy", "love");
    b = placeAt(b, 2, "Sugar Sprinkler", "love");        // 5s cast +1 pot adj
    b = placeAt(b, 3, "The Court Scribe", "love");       // 6s cast
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = tick(s, 7, mulberry32(1));
    // Sprinkler at 5s buffs adjacent allies (slots 1 + 3): Doughboy
    // gets +1 pot first, then Court Scribe gets +1 pot. The LAST
    // ability-buff in the log is Court Scribe's. At 6s Scribe casts
    // and amplifies its OWN most recent gain by +1 → +2 pot total.
    // (Spec literal-interprets "the last permanent buff any ally
    // gained" as the most recent log entry, which is Scribe itself.)
    const scribe = s.hirelingStates.get("The Court Scribe-3")!;
    expect(scribe.permanentPotencyGainedThisRound).toBeGreaterThanOrEqual(2);
  });

  test("The Candy Architect: gains +2 perm stock when a Sugar ally's permanent potency is buffed", () => {
    let b = createBoard();
    b = placeAt(b, 1, "Doughboy", "love");                // Sugar ally — Sprinkler will buff
    b = placeAt(b, 2, "Sugar Sprinkler", "love");          // adj +1 pot
    b = placeAt(b, 3, "The Candy Architect", "love");      // listens for Sugar pot buffs
    let s = initializeActionState(b, defaultPriceMap(ACTIVE), ACTIVE, mulberry32(1));
    s = tick(s, 6, mulberry32(1));
    const arch = s.hirelingStates.get("The Candy Architect-3")!;
    // Sprinkler at 5s buffs Doughboy (+1 potency, Sugar). Architect
    // reacts → +2 permanent stock this round. (Sprinkler also buffs
    // Architect directly — that doesn't fire its own reactive hook.)
    expect(arch.permanentStockGainedThisRound).toBeGreaterThanOrEqual(2);
  });
});
