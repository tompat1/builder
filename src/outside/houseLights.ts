/**
 * Exterior try-out lights: facade sconces, door lights, LED strips, garden bollards.
 * Daylight mode (sun / moon / neutral) drives how bright the scene and fixtures read.
 */

export type DaylightMode = 'sun' | 'moon' | 'neutral';

export const DAYLIGHT_MODES: readonly DaylightMode[] = ['sun', 'moon', 'neutral'];

export function acceptDaylightMode(value: unknown): DaylightMode {
  if (value === 'moon' || value === 'neutral') return value;
  return 'sun';
}

export interface HouseLightsConfig {
  /** Wall washers auto-placed on the front facade. */
  facadeLights: boolean;
  /** Sconce above each exterior door. */
  doorLight: boolean;
  /** Soft LED strip under door canopy / front eave. */
  ledStrips: boolean;
  /** Garden bollards in front of the house. */
  gardenLights: boolean;
}

export const DEFAULT_HOUSE_LIGHTS: HouseLightsConfig = {
  facadeLights: true,
  doorLight: false,
  ledStrips: false,
  gardenLights: false
};

export type HouseLightKey = keyof HouseLightsConfig;

export function parseHouseLights(raw: unknown): HouseLightsConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_HOUSE_LIGHTS };
  const src = raw as Record<string, unknown>;
  return {
    facadeLights:
      typeof src.facadeLights === 'boolean' ? src.facadeLights : DEFAULT_HOUSE_LIGHTS.facadeLights,
    doorLight: src.doorLight === true,
    ledStrips: src.ledStrips === true,
    gardenLights: src.gardenLights === true
  };
}

/**
 * How dark the sky should read for a given sun hour (sun mode only).
 * Evening (~18+) and early morning ramp toward night.
 */
export function nightGainForHour(hour: number, altitude: number): number {
  if (altitude <= 0.02) return 1;
  if (hour >= 19.5) return Math.min(1, (hour - 19.5) / 1.5 + 0.55);
  if (hour >= 18) return Math.min(0.7, ((hour - 18) / 1.5) * 0.55);
  if (hour <= 6.5) return Math.min(1, (6.5 - hour) / 1.5 + 0.45);
  if (hour <= 7.5) return Math.min(0.45, (7.5 - hour) / 1);
  return 0;
}

/** Exterior fixture PointLight intensity scales up as the sky goes dark. */
export function fixtureLightIntensity(base: number, nightGain: number): number {
  return base * (0.15 + 0.85 * Math.max(nightGain, 0.08));
}
