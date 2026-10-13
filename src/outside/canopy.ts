export interface DoorCanopyInput {
  doorX: number;
  doorWidth: number;
  panelWidth?: number;
  cornerSide?: 'left' | 'right' | null;
  defaultOverhang?: number;
  cornerClearance?: number;
}

export interface DoorCanopyLayout {
  left: number;
  right: number;
  width: number;
  canopyX: number;
  leftBracketX: number;
  rightBracketX: number;
  fasciaWidth: number;
}

/**
 * Calculates bounds, overhang, and bracket placement for an exterior door canopy (skärmtak).
 * The door canopy, fascia, and brackets are always symmetrically centered on the door.
 * When near an exterior corner, the overhang is constrained equally on both sides so the
 * canopy stays centered over the door while clearing the corner trim.
 */
export function computeDoorCanopyLayout(input: DoorCanopyInput): DoorCanopyLayout {
  const defaultOverhang = input.defaultOverhang ?? 0.28;
  const pw = input.panelWidth ?? (input.doorWidth + defaultOverhang * 2);
  const cornerClearance = input.cornerClearance ?? 0.185;

  let maxOverhang = defaultOverhang;

  if (input.cornerSide === 'left') {
    const minX = -pw / 2 + cornerClearance;
    const available = (input.doorX - input.doorWidth / 2) - minX;
    if (available < maxOverhang) {
      maxOverhang = Math.max(0.08, available);
    }
  } else if (input.cornerSide === 'right') {
    const maxX = pw / 2 - cornerClearance;
    const available = maxX - (input.doorX + input.doorWidth / 2);
    if (available < maxOverhang) {
      maxOverhang = Math.max(0.08, available);
    }
  }

  const halfWidth = input.doorWidth / 2 + maxOverhang;
  const left = input.doorX - halfWidth;
  const right = input.doorX + halfWidth;
  const width = halfWidth * 2;
  const canopyX = input.doorX;
  const fasciaWidth = width + 0.02;

  const bracketOffset = Math.min(halfWidth - 0.06, input.doorWidth / 2 + 0.18);
  const leftBracketX = input.doorX - bracketOffset;
  const rightBracketX = input.doorX + bracketOffset;

  const round4 = (n: number) => Math.round(n * 10000) / 10000;

  return {
    left: round4(left),
    right: round4(right),
    width: round4(width),
    canopyX: round4(canopyX),
    leftBracketX: round4(leftBracketX),
    rightBracketX: round4(rightBracketX),
    fasciaWidth: round4(fasciaWidth)
  };
}
