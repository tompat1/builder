/** Classic gable. The eaves sit on the wall height the user set. */
export const GABLE_PITCH_DEG = 22;

/** Shallower gable. The eaves are lifted so the room has more standing height. */
export const GABLE_EXTRA_PITCH_DEG = 14;

/** How far the extra-height gable raises the wall plate, in millimetres. */
export const GABLE_EXTRA_HEIGHT_MM = 400;

/** Mono-pitch roof angle. */
export const PULPET_PITCH_DEG = 12;

export type RoofId = 'pulpettak' | 'sadeltak' | 'sadeltak14' | 'flackt';

export function isGableRoof(id: string): boolean {
  return id === 'sadeltak' || id === 'sadeltak14';
}

export function gablePitchDegrees(id: string): number {
  return id === 'sadeltak14' ? GABLE_EXTRA_PITCH_DEG : GABLE_PITCH_DEG;
}

/** Extra wall-plate height for the raised gable. Other roofs stay on the set wall. */
export function eaveLiftMm(id: string): number {
  return id === 'sadeltak14' ? GABLE_EXTRA_HEIGHT_MM : 0;
}

/**
 * Calculates wall plate height in metres so that the building's highest point
 * (from ground y = 0 up to the top of the roof) exactly matches totalHeightM.
 */
export function wallPlateHeightM(
  roofType: string,
  depthM: number,
  totalHeightM: number,
  flushRoof = false
): number {
  if (isGableRoof(roofType)) {
    const angleRad = (gablePitchDegrees(roofType) * Math.PI) / 180;
    const rise = Math.tan(angleRad) * (depthM / 2);
    const ridgeCapOffset = 0.085;
    const plate = totalHeightM - rise - ridgeCapOffset;
    return Math.max(1.8, plate);
  }
  if (roofType === 'flackt') {
    const roofTopOffset = 0.08;
    return Math.max(2.0, totalHeightM - roofTopOffset);
  }
  // pulpettak (12° mono-pitch)
  const angleRad = (PULPET_PITCH_DEG * Math.PI) / 180;
  const overhang = flushRoof ? 0.02 : 0.4;
  const roofThick = 0.1;
  const fasciaTop = roofThick / 2 + 0.008;
  const frontRise = overhang * Math.tan(angleRad) + (roofThick / 2) / Math.cos(angleRad) + fasciaTop * Math.cos(angleRad);
  const plate = totalHeightM - frontRise;
  return Math.max(1.8, plate);
}
