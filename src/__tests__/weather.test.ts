import { createBoard } from "../board/board";
import { mulberry32 } from "../potions/rng";
import { defaultPriceMap } from "../pricing/panel";
import { initializeActionState, setWeather, tick } from "../action/state";
import { tickWeather, Weather } from "../action/weather";

const FROG_FOG: Weather = {
  id: "frog-fog",
  name: "Frog Fog",
  remainingSeconds: 5,
  effect: {},
};

describe("tickWeather", () => {
  test("null in, null out", () => {
    expect(tickWeather(null, 5)).toBeNull();
  });

  test("decrements remaining seconds", () => {
    const next = tickWeather(FROG_FOG, 2);
    expect(next?.remainingSeconds).toBe(3);
  });

  test("clears when duration hits zero", () => {
    expect(tickWeather(FROG_FOG, 5)).toBeNull();
    expect(tickWeather(FROG_FOG, 100)).toBeNull();
  });

  test("indefinite weather (null duration) passes through unchanged", () => {
    const forever: Weather = { ...FROG_FOG, remainingSeconds: null };
    expect(tickWeather(forever, 10)).toBe(forever);
  });

  test("rejects NaN / negative delta", () => {
    expect(() => tickWeather(FROG_FOG, NaN)).toThrow();
    expect(() => tickWeather(FROG_FOG, -1)).toThrow();
  });
});

describe("weather in ActionState", () => {
  test("setWeather installs and logs; tick decays and clears it", () => {
    let s = initializeActionState(
      createBoard(),
      defaultPriceMap([]),
      [],
      mulberry32(1)
    );
    s = setWeather(s, FROG_FOG);
    expect(s.weather?.id).toBe("frog-fog");
    expect(
      s.log.find((e) => e.kind === "weather-started")
    ).toBeDefined();

    s = tick(s, 3, mulberry32(1));
    expect(s.weather?.remainingSeconds).toBe(2);

    s = tick(s, 5, mulberry32(1));
    expect(s.weather).toBeNull();
    expect(
      s.log.find((e) => e.kind === "weather-cleared")
    ).toBeDefined();
  });
});

describe("Weather effects (Phase 10)", () => {
  const { spawnWeather, WEATHER_CATALOG } = require("../action/weather");
  const { ALL_HIRELINGS } = require("../cards/hirelings");
  const { placeHireling } = require("../board/board");
  const { createHirelingInstance } = require("../board/hand");
  const { setPrice } = require("../pricing/panel");
  const { addCustomer } = require("../action/state");

  test("WEATHER_CATALOG defines five concrete events", () => {
    const ids = WEATHER_CATALOG.map((w: Weather) => w.id);
    expect(ids).toEqual(
      expect.arrayContaining(["rain", "heatwave", "market-rush", "moonlit", "frog-fog"])
    );
  });

  test("spawnWeather instantiates a catalog entry with default duration", () => {
    const w = spawnWeather("rain");
    expect(w).not.toBeNull();
    expect(w!.id).toBe("rain");
    expect(w!.remainingSeconds).toBe(25);
  });

  test("Heatwave shaves 1s off Sugar Guild cast times", () => {
    const dough = ALL_HIRELINGS.find((h: any) => h.name === "Doughboy")!;
    let b = createBoard();
    b = placeHireling(b, 3, createHirelingInstance(dough, "d", "love"));
    let s = initializeActionState(
      b,
      defaultPriceMap(["love" as const]),
      ["love" as const],
      mulberry32(1)
    );
    s = setWeather(s, spawnWeather("heatwave")!);
    // Doughboy is 5s cast → reduced to 4s. With weather, after one
    // full 5-second tick, the next cast already fired (at t=4) and
    // rescheduled. Quickcraft x2 fired so temporaryStock = 2.
    s = tick(s, 4.5, mulberry32(1));
    const hs = s.hirelingStates.get("d")!;
    expect(hs.castsSoFar).toBeGreaterThanOrEqual(1);
  });

  test("Market Rush adds +1 gold per sale", () => {
    const jj = ALL_HIRELINGS.find((h: any) => h.name === "Jumping Jack")!;
    let b = createBoard();
    b = placeHireling(b, 3, createHirelingInstance(jj, "jj", "love"));
    let prices = defaultPriceMap(["love" as const]);
    prices = setPrice(prices, "love", 1, 1);
    let s = initializeActionState(b, prices, ["love" as const], mulberry32(1), 0, 0);
    s = setWeather(s, spawnWeather("market-rush")!);
    s = addCustomer(s, {
      id: "c", desiredType: "love", budget: 5, qualityThreshold: 1,
      reputationStars: 2, patienceSeconds: 4,
      axisPriority: ["focus", "type", "budget", "quality"],
    });
    s = tick(s, 4, mulberry32(1));
    // Sale fires: 1 unit × 1g = 1g + 1g (Market Rush bonus) = 2g.
    expect(s.gold).toBeGreaterThanOrEqual(2);
  });
});
