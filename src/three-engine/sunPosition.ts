/** Compass bearing the house front faces, clockwise from north. */
export const COMPASS_FACINGS = ['north', 'east', 'south', 'west'] as const;

export type CompassFacing = (typeof COMPASS_FACINGS)[number];

/** Stockholm. Equinox sun, so noon is due south and the day is about 06:00–18:00. */
const LATITUDE_DEG = 59;
const DEG = Math.PI / 180;

export const SUN_HOUR_MIN = 5;
export const SUN_HOUR_MAX = 21;

const HEADING: Record<CompassFacing, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270
};

export function headingForFacing(facing: CompassFacing): number {
  return HEADING[facing];
}

export function clampSunHour(hour: number): number {
  if (!Number.isFinite(hour)) return 12;
  const stepped = Math.round(hour * 4) / 4;
  return Math.min(SUN_HOUR_MAX, Math.max(SUN_HOUR_MIN, stepped));
}

export function formatSunHour(hour: number): string {
  const total = Math.round(clampSunHour(hour) * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** North and east on the ground. The house front stays on +Z. */
export function compassAxes(headingDeg: number): {
  north: { x: number; z: number };
  east: { x: number; z: number };
} {
  const h = headingDeg * DEG;
  return {
    north: { x: Math.sin(h), z: Math.cos(h) },
    east: { x: -Math.cos(h), z: Math.sin(h) }
  };
}

export type SunPlacement = {
  x: number;
  y: number;
  z: number;
  altitude: number;
};

/**
 * Unit vector from the house toward the sun.
 * Altitude is negative when the sun is below the horizon.
 * Heading is the compass bearing the front (+Z) faces.
 */
export function sunPlacement(hour: number, headingDeg: number): SunPlacement {
  const H = (hour - 12) * 15 * DEG;
  const phi = LATITUDE_DEG * DEG;
  const sinAlt = Math.cos(phi) * Math.cos(H);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAlt = Math.cos(altitude) || 1;
  const cosAz = Math.max(-1, Math.min(1, (-Math.sin(phi) * Math.cos(H)) / cosAlt));
  const sinAz = Math.max(-1, Math.min(1, -Math.sin(H) / cosAlt));
  const horizontal = Math.hypot(sinAz, cosAz) || 1;
  const eastAmt = (sinAz / horizontal) * Math.abs(cosAlt);
  const northAmt = (cosAz / horizontal) * Math.abs(cosAlt);
  const { north, east } = compassAxes(headingDeg);
  const x = east.x * eastAmt + north.x * northAmt;
  const z = east.z * eastAmt + north.z * northAmt;
  const y = sinAlt;
  const length = Math.hypot(x, y, z) || 1;
  return { x: x / length, y: y / length, z: z / length, altitude };
}
