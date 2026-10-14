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
 * A corner door stays centred in the gap between that board and the far edge,
 * which is (cornerClearance - edge) / 2 from the middle of the panel.
 */
export function fittedDoorOpening(
  itemId: string | undefined,
  panelWidth: number,
  cornerSide?: 'left' | 'right' | null
): { width: number; shift: number } {
  const wanted = doorModuleMetres(itemId);
  const corner = cornerSide === 'left' || cornerSide === 'right';
  if (!corner) {
    const available = Math.max(0.46, panelWidth - 0.08);
    return { width: Math.min(wanted, available), shift: 0 };
  }
  const cornerClearance = 0.170;
  const edge = 0.045;
  const half = panelWidth / 2;
  const minLeft = cornerSide === 'left' ? -half + cornerClearance : -half + edge;
  const maxRight = cornerSide === 'right' ? half - cornerClearance : half - edge;
  const span = Math.max(0, maxRight - minLeft);
  const width = Math.min(wanted, Math.max(0.46, span));
  const centered = (cornerClearance - edge) / 2;
  let shift = cornerSide === 'left' ? centered : -centered;
  const minShift = minLeft + width / 2;
  const maxShift = maxRight - width / 2;
  if (minShift <= maxShift) shift = Math.min(maxShift, Math.max(minShift, shift));
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
