/** A fixed panorama turned on its end, so a tall wall bay gets a tall pane. */
export const PORTRAIT_PANORAMA = 'panorama-portrait';

/** A low fixed pane. On the cube it sits above the front door, not as a 10×12 tilt window. */
export const OVERLIGHT = 'overlight';

const SLIDING_DOOR = new Set(['SKJUTDORR', 'SKJUTDORR3']);

/**
 * A 10×12 tilt window drawn above a hinged door is the low over-door pane.
 * Keep that pane as its own window so the label matches the glass.
 */
export function overlightItem(
  itemId: string | undefined,
  aboveDoor: boolean,
  doorId: string | undefined
): string | undefined {
  if (itemId === 'standard-single' && aboveDoor && !SLIDING_DOOR.has(doorId ?? '')) return OVERLIGHT;
  return itemId;
}

/** Height of the low pane, in metres, for an opening that already fits the bay. */
export function overlightHeight(openingWidth: number): number {
  return Math.min(0.46, Math.max(0.34, openingWidth * 0.38));
}

const SIDE = 0.09;
const EDGE = 0.045;
const HEAD_BOARD = 0.085;
const SILL_BOARD = 0.065;

export interface PortraitPane {
  width: number;
  height: number;
  /** Sill, measured up from the panel base. */
  sill: number;
}

/**
 * A portrait pane inside one wall panel.
 * It uses the height of the bay and stays narrower than it is tall,
 * so a tall section reads as a window rather than a square.
 */
/** Module width of a catalog door, in metres. 10×21 is 1.0 m, 20×21 is 2.0 m. */
export function doorModuleMetres(itemId: string | undefined): number {
  if (itemId === 'SKJUTDORR3') return 3;
  if (itemId === 'SKJUTDORR') return 2;
  if (itemId === 'SVANSHALL') return 1.6;
  return 1;
}

/**
 * Leaf width for a door in one wall bay.
 * The module size stays put when the house is resized. The bay only narrows
 * the leaf when the panel itself cannot hold that module clear of a corner board.
 */
export function fittedDoorOpening(
  itemId: string | undefined,
  panelWidth: number,
  cornerSide?: 'left' | 'right' | null
): { width: number; shift: number } {
  const wanted = doorModuleMetres(itemId);
  const corner = cornerSide === 'left' || cornerSide === 'right';
  const cornerInset = 0.17;
  const inset = corner ? cornerInset : 0;
  const reveal = corner ? 0.04 : 0.08;
  let available = panelWidth - inset - reveal;
  available = Math.min(available, Math.max(0.46, panelWidth - 0.04));
  available = Math.max(0.46, available);
  const width = Math.min(wanted, available);
  let shift = 0;
  if (corner) {
    const edge = cornerSide === 'left' ? -panelWidth / 2 + inset : panelWidth / 2 - inset;
    shift = cornerSide === 'left' ? edge + width / 2 : edge - width / 2;
  }
  return { width, shift };
}

export function portraitPane(panelWidth: number, panelHeight: number, isUpper: boolean): PortraitPane {
  const span = Math.max(0.46, panelWidth - SIDE * 2 - EDGE * 2);
  const sill = isUpper ? SILL_BOARD + 0.08 : 0.5;
  const topGap = (isUpper ? 0.16 : 0.28) + HEAD_BOARD;
  const height = Math.min(1.7, Math.max(0.9, panelHeight - topGap - sill));
  const width = Math.min(span, 0.9, height * 0.56);
  return { width, height, sill };
}
