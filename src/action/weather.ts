import { PotionTypeId } from "../potions/types";
import { HirelingGuild } from "../cards/types";

/**
 * Phase-10 weather event payload. A weather event affects the action
 * round in well-defined ways via a small set of optional deltas; the
 * tick loop consumes them when computing axis fills, cast scheduling,
 * and pricing.
 */
export interface WeatherEffect {
  /** Per-second focus boost added to a side's fill on a matching customer. */
  focusBoostPerSecond?: { side: "player" | "opponent"; potionType?: PotionTypeId; amount: number };
  /** Multiplier applied to qualityPerPotency for matching potency. */
  qualityMultiplier?: number;
  /** Seconds shaved off cast times for a guild (clamped at 1s). */
  castSpeedupForGuild?: { guild: HirelingGuild; seconds: number };
  /** Bonus gold added to every sale. */
  goldPerSale?: number;
  /** Player-side passive contribution multiplier (all axes). */
  playerPassiveMultiplier?: number;
}

export interface Weather {
  id: string;
  name: string;
  /** Seconds remaining for this weather to persist. null = indefinite. */
  remainingSeconds: number | null;
  effect: WeatherEffect;
}

/**
 * Catalog of weather events that can roll during the action phase.
 * Tuned to feel impactful without dominating the round (~30s typical).
 *
 *   - rain: Luck potions surge (+1 focus/s on Luck customers).
 *   - heatwave: Sugar Guild casts 1s faster.
 *   - market-rush: every sale grants +1 gold.
 *   - moonlit: quality axis fills 50% faster (potency potions shine).
 *   - frog-fog: opponent's passive contribution is dampened — model
 *     as a player-side passive multiplier of 1.25 (player picks up
 *     ground while the fog confuses the opponent).
 */
export const WEATHER_CATALOG: readonly Omit<Weather, "remainingSeconds">[] = Object.freeze([
  {
    id: "rain",
    name: "Rain",
    effect: { focusBoostPerSecond: { side: "player", potionType: "luck", amount: 1 } },
  },
  {
    id: "heatwave",
    name: "Heatwave",
    effect: { castSpeedupForGuild: { guild: "Sugar Guild", seconds: 1 } },
  },
  {
    id: "market-rush",
    name: "Market Rush",
    effect: { goldPerSale: 1 },
  },
  {
    id: "moonlit",
    name: "Moonlit Market",
    effect: { qualityMultiplier: 1.5 },
  },
  {
    id: "frog-fog",
    name: "Frog Fog",
    effect: { playerPassiveMultiplier: 1.25 },
  },
] as const);

/** Default weather duration in seconds. */
export const WEATHER_DEFAULT_SECONDS = 25;

/** Build a Weather instance from a catalog entry id. Returns null if id is unknown. */
export function spawnWeather(id: string, durationSeconds: number = WEATHER_DEFAULT_SECONDS): Weather | null {
  const entry = WEATHER_CATALOG.find((w) => w.id === id);
  if (!entry) return null;
  return { ...entry, remainingSeconds: durationSeconds };
}

/**
 * Decrement weather duration by `deltaSeconds`. Returns null (cleared)
 * when duration falls to zero or below. Indefinite weather (null
 * duration) and already-null inputs pass through unchanged.
 */
export function tickWeather(
  weather: Weather | null,
  deltaSeconds: number
): Weather | null {
  if (!weather) return null;
  if (weather.remainingSeconds === null) return weather;
  if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
    throw new Error(
      `tickWeather deltaSeconds must be a non-negative finite number (got ${deltaSeconds}).`
    );
  }
  const next = weather.remainingSeconds - deltaSeconds;
  if (next <= 0) return null;
  return { ...weather, remainingSeconds: next };
}
