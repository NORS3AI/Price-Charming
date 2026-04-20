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
