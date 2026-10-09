/** A fixed panorama turned on its end, so a tall wall bay gets a tall pane. */
export const PORTRAIT_PANORAMA = 'panorama-portrait';

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
export function portraitPane(panelWidth: number, panelHeight: number, isUpper: boolean): PortraitPane {
  const span = Math.max(0.46, panelWidth - SIDE * 2 - EDGE * 2);
  const sill = isUpper ? SILL_BOARD + 0.05 : Math.min(0.4, panelHeight * 0.16);
  const topGap = (isUpper ? 0.1 : 0.08) + HEAD_BOARD;
  const height = Math.max(0.7, panelHeight - topGap - sill);
  const width = Math.min(span, height * 0.86);
  return { width, height, sill };
}
