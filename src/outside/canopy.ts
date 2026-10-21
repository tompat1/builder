import type { HouseTerrace } from './terrace';

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

export interface DoorCoverageCheck {
  doorWall: 'front' | 'back' | 'left' | 'right';
  doorAlong: number;
  doorWidth: number;
  wallSpan: number;
  terraces: Array<HouseTerrace | {
    side: 'front' | 'back' | 'left' | 'right';
    span: 'door' | 'full';
    roof: boolean;
    building?: 'none' | 'sauna' | 'shed';
    hotTub?: boolean;
    buildingPlacement?: 'left' | 'right';
    buildingSize?: 'compact' | 'standard' | 'large';
  }>;
  /** Positions along the wall of all doors on this wall */
  wallDoorsAlong?: number[];
}

/**
 * Checks whether an exterior door is already covered by a terrace roof or
 * enclosed within an attached terrace building (sauna or shed), so that an
 * exterior door canopy (skärmtak) should not be rendered inside it.
 */
export function isDoorCoveredByAddition(check: DoorCoverageCheck): boolean {
  for (const terrace of check.terraces) {
    if (terrace.side !== check.doorWall) continue;
    // An open terrace roof covers this wall / door
    if (terrace.roof) {
      if (terrace.span === 'full') return true;
      return true;
    }
    // An attached building (sauna or shed) covers the door if the door is enclosed by it
    if (terrace.building === 'sauna' || terrace.building === 'shed') {
      if (terrace.span === 'door') return true;

      // Full-span terrace: check if door is enclosed inside the building's footprint
      const wallSpan = check.wallSpan;
      const isLeft = terrace.buildingPlacement === 'left';
      let targetBW = 2.2;
      if (terrace.building === 'sauna') {
        const sz = terrace.buildingSize ?? 'standard';
        if (sz === 'compact') targetBW = 1.8;
        else if (sz === 'large') targetBW = 2.6;
      }
      const bW = Math.min(wallSpan * 0.85, Math.max(1.3, targetBW));
      const initialBX = isLeft ? -wallSpan / 2 + bW / 2 : wallSpan / 2 - bW / 2;
      let bX = initialBX;

      if (terrace.building === 'sauna' && check.wallDoorsAlong && check.wallDoorsAlong.length > 0) {
        const matchingAlong = check.wallDoorsAlong.reduce((closest, along) => {
          return Math.abs(along - initialBX) < Math.abs(closest - initialBX) ? along : closest;
        }, check.wallDoorsAlong[0]);

        if (Math.abs(matchingAlong - initialBX) <= wallSpan * 0.6) {
          const minBX = -wallSpan / 2 + bW / 2;
          const maxBX = wallSpan / 2 - bW / 2;
          bX = Math.min(maxBX, Math.max(minBX, matchingAlong));
        }
      }

      const doorLeft = check.doorAlong - check.doorWidth / 2;
      const doorRight = check.doorAlong + check.doorWidth / 2;
      const buildingLeft = bX - bW / 2;
      const buildingRight = bX + bW / 2;

      // If the door overlaps or is inside the building footprint
      if (doorRight > buildingLeft - 0.05 && doorLeft < buildingRight + 0.05) {
        return true;
      }
    }
  }
  return false;
}
