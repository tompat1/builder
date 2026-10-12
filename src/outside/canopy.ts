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
 * When the door sits adjacent to an exterior corner, the canopy and brackets are safely
 * constrained away from the corner trim (knutbräda) so they do not collide or glitch.
 */
export function computeDoorCanopyLayout(input: DoorCanopyInput): DoorCanopyLayout {
  const defaultOverhang = input.defaultOverhang ?? 0.28;
  const pw = input.panelWidth ?? (input.doorWidth + defaultOverhang * 2);
  const cornerClearance = input.cornerClearance ?? 0.185;

  let left = input.doorX - input.doorWidth / 2 - defaultOverhang;
  let right = input.doorX + input.doorWidth / 2 + defaultOverhang;

  if (input.cornerSide === 'left') {
    const minX = -pw / 2 + cornerClearance;
    if (left < minX) {
      left = minX;
    }
  } else if (input.cornerSide === 'right') {
    const maxX = pw / 2 - cornerClearance;
    if (right > maxX) {
      right = maxX;
    }
  }

  const width = Math.max(input.doorWidth + 0.1, right - left);
  const canopyX = (left + right) / 2;
  const fasciaWidth = width + 0.02;

  const leftBracketX = Math.max(left + 0.06, input.doorX - (input.doorWidth / 2 + 0.18));
  const rightBracketX = Math.min(right - 0.06, input.doorX + (input.doorWidth / 2 + 0.18));

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
