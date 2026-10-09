/** Air under the rafters, so a loft room meets the roof without cutting it. */
const SHED_CLEARANCE = 0.16;
const GABLE_CLEARANCE = 0.24;

export interface CeilingStation {
  /** Position along the room, in metres. */
  at: number;
  /** Ceiling height at that position, in metres. */
  top: number;
}

/** A roof that falls from the front wall toward the back, like the mono-pitch. */
export interface ShedRoof {
  kind: 'shed';
  degrees: number;
  /** Front keeps the high eave on the front wall. Centre passes through the wall top at z = 0. */
  anchor: 'front' | 'centre';
  /** Lowest rear plate, in metres. The mono-pitch never drops below this. */
  minRear?: number;
}

/** A roof that peaks on the centre line and falls to both eaves. */
export interface GableRoofSlope {
  kind: 'gable';
  degrees: number;
}

export type RoofSlope = ShedRoof | GableRoofSlope;

function pitchTan(degrees: number) {
  return Math.tan((degrees * Math.PI) / 180);
}

/**
 * Height of the wall plate the roof sits on, at a world Z.
 * A shed falls toward the back. A gable peaks on the centre line.
 */
export function roofPlateY(slope: RoofSlope, depthM: number, wallTopM: number, z: number) {
  const tan = pitchTan(slope.degrees);
  if (slope.kind === 'gable') return wallTopM + tan * (depthM / 2 - Math.abs(z));
  if (slope.anchor === 'centre') return wallTopM + z * tan;
  const rear = Math.max(wallTopM - tan * depthM, slope.minRear ?? 0);
  const yMid = (wallTopM + rear) / 2;
  return yMid + z * tan;
}

/** Underside a loft room can reach at a world Z. */
export function loftCeilingY(slope: RoofSlope, depthM: number, wallTopM: number, z: number) {
  const clearance = slope.kind === 'gable' ? GABLE_CLEARANCE : SHED_CLEARANCE;
  return roofPlateY(slope, depthM, wallTopM, z) - clearance;
}

/** Local Z samples for one loft wall. A gable adds the ridge where the room crosses it. */
export function ceilingStations(slope: RoofSlope, localZ0: number, localZ1: number, roomZ: number) {
  const start = Math.min(localZ0, localZ1);
  const end = Math.max(localZ0, localZ1);
  const stations = [start, end];
  if (slope.kind === 'gable') {
    const ridge = -roomZ;
    if (ridge > start + 1e-4 && ridge < end - 1e-4) stations.push(ridge);
  }
  stations.sort((a, b) => a - b);
  return stations;
}

export function heightAt(stations: CeilingStation[], at: number) {
  if (stations.length === 0) return 0;
  if (at <= stations[0].at) return stations[0].top;
  const last = stations[stations.length - 1];
  if (at >= last.at) return last.top;
  for (let i = 1; i < stations.length; i++) {
    const prev = stations[i - 1];
    const next = stations[i];
    if (at > next.at) continue;
    const span = next.at - prev.at;
    const t = span === 0 ? 0 : (at - prev.at) / span;
    return prev.top + (next.top - prev.top) * t;
  }
  return last.top;
}

/** The part of a ceiling profile between two positions, with the ends filled in. */
export function sliceStations(stations: CeilingStation[], from: number, to: number): CeilingStation[] {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const inner = stations.filter((station) => station.at > start + 1e-6 && station.at < end - 1e-6);
  return [
    { at: start, top: heightAt(stations, start) },
    ...inner,
    { at: end, top: heightAt(stations, end) }
  ];
}
