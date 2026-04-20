/**
 * Placeholder for the weather-event system. The game spec mentions
 * dynamic weather (e.g. Frog Fog, Spell-made Lightning) but doesn't
 * yet define per-event mechanics. This module captures the shape and
 * duration model so later balance work can wire in concrete effects
 * without another architectural pass.
 */

/** Opaque effect payload — a future balance phase fills these in. */
export type WeatherEffect = Record<string, unknown>;

export interface Weather {
  id: string;
  name: string;
  /** Seconds remaining for this weather to persist. null = indefinite. */
  remainingSeconds: number | null;
  effect: WeatherEffect;
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
