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
  if (itemId === 'BASTUDORR') return 0.9;
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

/** Opening head stays this far under the roof, including the head board. */
export const ROOF_OPENING_CLEARANCE = 0.22 + 0.085;

/**
 * Top of the head board stays this far under the panel top.
 * The fascia laps about 12 cm over the wall, so a smaller gap puts the casing into the trim.
 */
const FASCIA_HEAD_GAP = 0.16;

export interface RoofOpening {
  winW: number;
  winH: number;
  winY: number;
  x?: number;
  sill?: number;
  head?: number;
}

/**
 * Keep an opening under a roof that rises across the bay.
 * A window moves down and keeps its height. A door stays on its sill and
 * shortens when the new pitch would otherwise cut the head.
 * A level wall is left as fitted.
 */
export function openingClearOfRoof<T extends RoofOpening>(
  opening: T,
  panelHeight: number,
  slope: number,
  options?: { pinSill?: boolean; minHeight?: number; clearance?: number }
): T {
  if (!(panelHeight > 0) || Math.abs(slope) < 1e-6) return opening;
  const clearance = options?.clearance ?? ROOF_OPENING_CLEARANCE;
  const pinSill = options?.pinSill === true;
  const minHeight = options?.minHeight ?? (pinSill ? 0.9 : 0.28);
  const halfH = panelHeight / 2;
  const cx = opening.x ?? 0;
  const left = cx - opening.winW / 2;
  const right = cx + opening.winW / 2;
  const roof = halfH + Math.min(left * slope, right * slope);
  const limit = roof - clearance;
  const top = opening.winY + opening.winH / 2;
  const bottom = opening.winY - opening.winH / 2;
  if (top <= limit + 1e-4) return opening;

  const floor = -halfH + 0.02;
  let nextBottom = bottom;
  let nextTop = limit;
  if (pinSill) {
    nextTop = Math.min(limit, bottom + opening.winH);
  } else {
    nextBottom = limit - opening.winH;
    if (nextBottom < floor) nextBottom = floor;
    nextTop = Math.min(limit, nextBottom + opening.winH);
  }
  if (nextTop - nextBottom < minHeight && limit - nextBottom >= 0.2) {
    nextTop = Math.min(limit, nextBottom + minHeight);
  }
  const winH = Math.max(0.2, nextTop - nextBottom);
  const winY = nextBottom + winH / 2;
  const next = { ...opening, winH, winY };
  if (opening.sill != null) next.sill = opening.sill + (nextBottom - bottom);
  if (opening.head != null) next.head = opening.head + (nextBottom + winH - top);
  return next;
}

export function portraitPane(panelWidth: number, panelHeight: number, isUpper: boolean): PortraitPane {
  const span = Math.max(0.46, panelWidth - SIDE * 2 - EDGE * 2);
  const sill = isUpper ? SILL_BOARD + 0.08 : 0.5;
  const topGap = (isUpper ? 0.16 : 0.28) + HEAD_BOARD;
  const height = Math.min(1.7, Math.max(0.9, panelHeight - topGap - sill));
  const width = Math.min(span, 0.9, height * 0.56);
  return { width, height, sill };
}

/** A narrow, tall window (modulmått 6×18) that fits tight bays and timber extension sections. */
export const NARROW_TALL = 'narrow-tall';

export interface NarrowTallPane {
  width: number;
  height: number;
  sill: number;
  shift: number;
}

export function narrowTallPane(
  panelWidth: number,
  panelHeight: number,
  isUpper: boolean,
  woodSpan?: { from: number; to: number } | null,
  cornerSide?: 'left' | 'right' | null
): NarrowTallPane {
  const side = 0.09;
  const headBoard = 0.085;
  const edge = 0.045;
  const sillEar = 0.02;
  const cornerClearance = 0.170;
  const half = panelWidth / 2;

  let shift = 0;
  let maxW: number;

  if (woodSpan) {
    const isWoodOnLeft = woodSpan.from <= -half + 0.01;
    const minX = (cornerSide === 'left' && isWoodOnLeft)
      ? woodSpan.from + cornerClearance
      : woodSpan.from + edge;
    const maxX = (cornerSide === 'right' && !isWoodOnLeft)
      ? woodSpan.to - cornerClearance
      : woodSpan.to - edge;
    const clearSpan = Math.max(0.35, maxX - minX);
    shift = (minX + maxX) / 2;
    maxW = Math.max(0.32, clearSpan - (side + sillEar) * 2);
  } else if (cornerSide) {
    const availableW = Math.max(0.46, panelWidth - cornerClearance - edge);
    maxW = Math.max(0.32, availableW - (side + sillEar) * 2);
    const offset = (cornerClearance - edge) / 2;
    shift = cornerSide === 'left' ? offset : -offset;
  } else {
    maxW = Math.max(0.32, panelWidth - (side + sillEar) * 2 - edge * 2);
  }

  const width = Math.min(0.54, maxW);
  const sill = isUpper ? SILL_BOARD + 0.08 : 0.36;
  const topGap = (isUpper ? 0.16 : 0.22) + headBoard;
  const height = Math.min(1.80, Math.max(0.7, panelHeight - topGap - sill));
  return { width, height, sill, shift };
}

export interface FittedWindowResult {
  winW: number;
  winH: number;
  winY: number;
  sill: number;
  head: number;
  x: number;
  casingSide?: number;
}

/**
 * Fits and adapts any window placed in a wall bay or narrow wooden overhang span.
 * When the available wooden span is narrow, dimensions adapt gracefully into a
 * custom-sized window that fits the space without clipping casing or encroaching
 * on concrete walls and corner boards.
 */
export function fittedWindowOpening(
  itemId: string | undefined,
  panelWidth: number,
  panelHeight: number,
  panelBase: number,
  isUpper: boolean,
  aboveDoor = false,
  cornerSide?: 'left' | 'right' | null,
  woodSpan?: { from: number; to: number } | null
): FittedWindowResult {
  const half = panelWidth / 2;
  const edge = 0.045;
  const cornerClearance = 0.170;
  const headBoard = 0.085;
  const sillBoard = 0.065;
  const centerY = panelBase + panelHeight / 2;

  let minX: number;
  let maxX: number;

  if (woodSpan) {
    const isWoodOnLeft = woodSpan.from <= -half + 0.01;
    minX = (cornerSide === 'left' && isWoodOnLeft)
      ? woodSpan.from + cornerClearance
      : woodSpan.from + edge;
    maxX = (cornerSide === 'right' && !isWoodOnLeft)
      ? woodSpan.to - cornerClearance
      : woodSpan.to - edge;
  } else if (cornerSide) {
    minX = cornerSide === 'left' ? -half + cornerClearance : -half + edge;
    maxX = cornerSide === 'right' ? half - cornerClearance : half - edge;
  } else {
    minX = -half + edge;
    maxX = half - edge;
  }

  const spaceW = Math.max(0.20, maxX - minX);
  const isNarrow = Boolean(woodSpan) || spaceW < 1.05;

  // Adaptive casing width in tight spaces so casing and window frame fit seamlessly
  const casingSide = isNarrow
    ? (spaceW < 0.65 ? Math.max(0.045, Math.min(0.08, spaceW * 0.11)) : 0.08)
    : 0.09;
  const sillEar = spaceW < 0.65 ? 0.01 : 0.02;
  const casingMargin = (casingSide + sillEar) * 2;
  const maxWinW = Math.max(0.18, spaceW - casingMargin);
  const shift = (minX + maxX) / 2;

  if (itemId === NARROW_TALL) {
    const pane = narrowTallPane(panelWidth, panelHeight, isUpper, woodSpan, cornerSide);
    const winW = Math.min(pane.width, maxWinW);
    const sill = panelBase + pane.sill;
    const head = sill + pane.height;
    return {
      winW,
      winH: pane.height,
      winY: (sill + head) / 2 - centerY,
      sill,
      head,
      x: shift,
      casingSide
    };
  }

  if (itemId === OVERLIGHT) {
    const defaultW = Math.max(0.46, panelWidth - 0.09 * 2 - edge * 2);
    const winW = Math.min(defaultW, maxWinW);
    const winH = overlightHeight(winW);
    const sill = isUpper
      ? panelBase + (aboveDoor ? 0.42 : 0.36)
      : panelBase + Math.min(1.05, Math.max(0.7, panelHeight * 0.38));
    const headLimit = panelBase + panelHeight - headBoard - 0.08;
    const head = Math.max(sill + 0.28, Math.min(sill + winH, headLimit));
    const fittedH = head - sill;
    return {
      winW,
      winH: fittedH,
      winY: (sill + head) / 2 - centerY,
      sill,
      head,
      x: shift,
      casingSide
    };
  }

  if (itemId === PORTRAIT_PANORAMA) {
    const pane = portraitPane(panelWidth, panelHeight, isUpper);
    const winW = Math.min(pane.width, maxWinW);
    const sill = panelBase + pane.sill;
    const head = sill + pane.height;
    return {
      winW,
      winH: pane.height,
      winY: (sill + head) / 2 - centerY,
      sill,
      head,
      x: shift,
      casingSide
    };
  }

  if (isUpper && itemId !== 'panorama') {
    const gapAbove = 0.16;
    const head = panelBase + panelHeight - gapAbove - headBoard;
    const defaultW = Math.max(0.46, panelWidth - 0.09 * 2 - edge * 2);
    const winW = Math.min(defaultW, maxWinW);
    const maxH = Math.max(0.28, head - (panelBase + sillBoard + 0.04));
    let winH = Math.min(maxH, winW * 0.42);
    let sill = head - winH;
    const minSill = panelBase + sillBoard + 0.02;
    if (sill < minSill) {
      sill = minSill;
      winH = Math.max(0.28, head - sill);
    }
    return {
      winW,
      winH,
      winY: (sill + head) / 2 - centerY,
      sill,
      head,
      x: shift,
      casingSide
    };
  }

  // Lower wall window:
  if (itemId === 'standard-single' || itemId === 'oppningsbart') {
    const wantsW = 1.05;
    if (!isNarrow && maxWinW >= wantsW && panelWidth >= 1.8) {
      const winW = wantsW;
      const winH = 0.72;
      const sill = panelBase + 1.05;
      const head = sill + winH;
      return { winW, winH, winY: (sill + head) / 2 - centerY, sill, head, x: shift, casingSide };
    }
    // Narrow wooden space or overhang: adapt window dimensions to fit space cleanly
    const winW = Math.min(wantsW, maxWinW);
    const headLimit = panelBase + panelHeight - headBoard - 0.22;
    const customH = winW < 0.75
      ? Math.min(headLimit - (panelBase + 0.50), Math.max(0.65, winW * 1.7))
      : Math.min(0.72, headLimit - (panelBase + 1.05));
    const sill = winW < 0.75 ? headLimit - customH : panelBase + 1.05;
    const actualHead = sill + customH;
    return {
      winW,
      winH: customH,
      winY: (sill + actualHead) / 2 - centerY,
      sill,
      head: actualHead,
      x: shift,
      casingSide
    };
  }

  // Any other window (panorama, sprojat, frost, etc.)
  const defaultW = Math.max(0.46, panelWidth - 0.09 * 2 - edge * 2);
  const winW = Math.min(defaultW, maxWinW);
  const headLimit = panelBase + panelHeight - headBoard - 0.22;
  if (isNarrow && winW < 0.85) {
    const customH = Math.min(headLimit - (panelBase + 0.45), Math.max(0.65, winW * 1.6));
    const sill = headLimit - customH;
    return {
      winW,
      winH: customH,
      winY: (sill + headLimit) / 2 - centerY,
      sill,
      head: headLimit,
      x: shift,
      casingSide
    };
  } else {
    const sillFromBase = Math.min(0.85, panelHeight * 0.34);
    const maxH = Math.max(0.4, panelHeight - headBoard - sillFromBase - 0.22);
    const winH = Math.min(maxH, Math.max(winW * 0.92, panelHeight * 0.42));
    const sill = panelBase + sillFromBase;
    const actualHead = sill + winH;
    return {
      winW,
      winH,
      winY: (sill + actualHead) / 2 - centerY,
      sill,
      head: actualHead,
      x: shift,
      casingSide
    };
  }
}

/** True when a fitted window had to move or shrink to stay on the wall. */
export function windowOpeningChanged(before: RoofOpening, after: RoofOpening) {
  return Math.abs(before.winW - after.winW) > 0.005
    || Math.abs(before.winH - after.winH) > 0.005
    || Math.abs(before.winY - after.winY) > 0.005
    || Math.abs((before.x ?? 0) - (after.x ?? 0)) > 0.005;
}

/**
 * Shrink and shift a window so the glass and its boards stay inside the panel.
 * A window that already fits is left where it is, including its sill height.
 */
export function containWindowInPanel<T extends RoofOpening & { casingSide?: number }>(
  opening: T,
  panelWidth: number,
  panelHeight: number,
  cornerSide?: 'left' | 'right' | null,
  woodSpan?: { from: number; to: number } | null,
  slope = 0
): T {
  const halfW = panelWidth / 2;
  const halfH = panelHeight / 2;
  const edge = 0.045;
  const cornerClearance = 0.170;

  let minX: number;
  let maxX: number;
  if (woodSpan) {
    const woodOnLeft = woodSpan.from <= -halfW + 0.01;
    minX = cornerSide === 'left' && woodOnLeft ? woodSpan.from + cornerClearance : woodSpan.from + edge;
    maxX = cornerSide === 'right' && !woodOnLeft ? woodSpan.to - cornerClearance : woodSpan.to - edge;
  } else if (cornerSide) {
    minX = cornerSide === 'left' ? -halfW + cornerClearance : -halfW + edge;
    maxX = cornerSide === 'right' ? halfW - cornerClearance : halfW - edge;
  } else {
    minX = -halfW + edge;
    maxX = halfW - edge;
  }

  const spaceW = Math.max(0, maxX - minX);
  const casing = opening.casingSide ?? 0.09;
  const ear = spaceW < 0.65 ? 0.01 : 0.02;
  const margin = casing + ear;
  let { winW, x = 0 } = opening;
  const maxW = Math.max(0.18, spaceW - margin * 2);
  if (winW > maxW) winW = maxW;
  const minShift = minX + margin + winW / 2;
  const maxShift = maxX - margin - winW / 2;
  if (minShift <= maxShift) x = Math.min(maxShift, Math.max(minShift, x));

  const boardLeft = x - winW / 2 - casing;
  const boardRight = x + winW / 2 + casing;
  const roof = halfH + (Math.abs(slope) < 1e-6 ? 0 : Math.min(boardLeft * slope, boardRight * slope));
  const limitTop = roof - FASCIA_HEAD_GAP - HEAD_BOARD;
  const limitBottom = -halfH + 0.02 + SILL_BOARD;

  let top = opening.winY + opening.winH / 2;
  let bottom = opening.winY - opening.winH / 2;
  if (top > limitTop) {
    const drop = top - limitTop;
    top -= drop;
    bottom -= drop;
  }
  if (bottom < limitBottom) bottom = limitBottom;
  if (top > limitTop) top = limitTop;
  let winH = top - bottom;
  if (!(winH > 0.1) || limitTop - limitBottom < 0.1) {
    const room = Math.max(0.1, limitTop - limitBottom);
    winH = Math.min(Math.max(opening.winH, 0.1), room);
    bottom = limitBottom;
    top = Math.min(limitTop, bottom + winH);
    winH = Math.max(0.1, top - bottom);
  }

  const winY = bottom + winH / 2;
  if (!windowOpeningChanged(opening, { winW, winH, winY, x })) return opening;

  const oldBottom = opening.winY - opening.winH / 2;
  const oldTop = opening.winY + opening.winH / 2;
  const next = { ...opening, winW, winH, winY, x };
  if (opening.sill != null) next.sill = opening.sill + (bottom - oldBottom);
  if (opening.head != null) next.head = opening.head + (top - oldTop);
  return next;
}

/**
 * Centers along a wall run (0 … span), with equal end margins and equal centre spacing.
 * `endMargin` keeps panes clear of corner boards and casing.
 */
export function evenWindowCentersAlongRun(
  span: number,
  count: number,
  winW: number,
  endMargin = 0.28
): number[] {
  if (count < 1 || span <= 0 || winW <= 0) return [];
  const n = count;
  const margin = Math.max(0.12, endMargin);
  const maxW = Math.max(0.28, (span - 2 * margin - (n - 1) * 0.12) / n);
  const usedW = Math.min(winW, maxW);
  const first = margin + usedW / 2;
  const last = span - margin - usedW / 2;
  if (n === 1 || last <= first) return [span / 2];
  return Array.from({ length: n }, (_, i) => first + ((last - first) * i) / (n - 1));
}

export interface RhythmWallOpening {
  /** Centre along the run, measured from the start of the run (0 … span). */
  along: number;
  winW: number;
}

export interface RhythmPanelOpening {
  /** Panel index within the full wall (not only the run). */
  panelIndex: number;
  /** Local X in the panel group (0 = panel centre). */
  x: number;
  winW: number;
  /** Draw frame/glass on this panel (centre lies here). Neighbours may only cut cladding. */
  drawFeature: boolean;
}

/**
 * Even centres along the run with equal gaps and corner-safe end margins.
 * Returns wall-run coordinates (not snapped to panel centres).
 */
export function rhythmOpeningsAlongRun(
  runLength: number,
  windowCount: number,
  panelWidth: number,
  winW: number,
  endMargin = 0.3
): RhythmWallOpening[] {
  if (runLength < 1 || windowCount < 1 || panelWidth <= 0) return [];
  const span = runLength * panelWidth;
  // Keep panes clear of corner boards; also leave a little air between panes.
  const maxW = Math.max(0.32, Math.min(winW, (span - 2 * endMargin - (windowCount - 1) * 0.2) / windowCount));
  const centers = evenWindowCentersAlongRun(span, windowCount, maxW, endMargin);
  return centers.map((along) => ({ along, winW: maxW }));
}

/**
 * Maps wall-run openings onto a single panel: local X for cladding (may straddle the
 * bay edge) and whether this panel owns the window feature.
 */
export function rhythmOpeningForPanel(
  openings: RhythmWallOpening[],
  runStart: number,
  runLength: number,
  panelIndex: number,
  panelWidth: number
): RhythmPanelOpening | null {
  if (panelIndex < runStart || panelIndex >= runStart + runLength) return null;
  const runLocal = panelIndex - runStart;
  const panelCenterAlong = (runLocal + 0.5) * panelWidth;
  const panelLeft = runLocal * panelWidth;
  const panelRight = panelLeft + panelWidth;
  const isLast = runLocal === runLength - 1;
  let owner: RhythmPanelOpening | null = null;
  let cutOnly: RhythmPanelOpening | null = null;
  for (const win of openings) {
    const left = win.along - win.winW / 2;
    const right = win.along + win.winW / 2;
    if (right <= panelLeft + 0.01 || left >= panelRight - 0.01) continue;
    const x = win.along - panelCenterAlong;
    // Exactly one panel owns each centre: [panelLeft, panelRight), last panel includes the end.
    const drawFeature = isLast
      ? win.along >= panelLeft && win.along <= panelRight + 1e-9
      : win.along >= panelLeft && win.along < panelRight;
    const candidate: RhythmPanelOpening = {
      panelIndex,
      x,
      winW: win.winW,
      drawFeature
    };
    if (drawFeature) {
      // If two centres land in one bay (degenerate layout), keep the nearer to mid-bay.
      if (!owner || Math.abs(candidate.x) < Math.abs(owner.x)) owner = candidate;
    } else if (!cutOnly) {
      cutOnly = candidate;
    }
  }
  return owner ?? cutOnly;
}

/** True when every pair of openings has a clear gap (no overlapping frames). */
export function rhythmOpeningsDoNotOverlap(openings: RhythmWallOpening[], minGap = 0.08): boolean {
  if (openings.length < 2) return true;
  const sorted = [...openings].sort((a, b) => a.along - b.along);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]!;
    const next = sorted[i]!;
    const gap = (next.along - next.winW / 2) - (prev.along + prev.winW / 2);
    if (gap < minGap - 1e-6) return false;
  }
  return true;
}

/** @deprecated Prefer rhythmOpeningsAlongRun + rhythmOpeningForPanel. */
export function rhythmOpeningsInRun(
  runStart: number,
  runLength: number,
  windowCount: number,
  panelWidth: number,
  winW: number,
  options?: { endMargin?: number }
): RhythmPanelOpening[] {
  const along = rhythmOpeningsAlongRun(
    runLength,
    windowCount,
    panelWidth,
    winW,
    options?.endMargin ?? 0.3
  );
  const out: RhythmPanelOpening[] = [];
  for (let i = 0; i < runLength; i += 1) {
    const mapped = rhythmOpeningForPanel(along, runStart, runLength, runStart + i, panelWidth);
    if (mapped?.drawFeature) out.push(mapped);
  }
  return out;
}
