/** Classic gable. The eaves sit on the wall height the user set. */
export const GABLE_PITCH_DEG = 22;

/** Shallower gable. The eaves are lifted so the room has more standing height. */
export const GABLE_EXTRA_PITCH_DEG = 14;

/** How far the extra-height gable raises the wall plate, in millimetres. */
export const GABLE_EXTRA_HEIGHT_MM = 400;

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
