const OVERLIGHT = 'overlight';
const SLIDING_DOOR = new Set(['SKJUTDORR', 'SKJUTDORR3']);

export function overlightItem(
  itemId: string | undefined,
  aboveDoor: boolean,
  doorId: string | undefined
): string | undefined {
  if (itemId === 'standard-single' && aboveDoor && !SLIDING_DOOR.has(doorId ?? '')) return OVERLIGHT;
  return itemId;
}

export interface WallSlot {
  id: string;
  wall: 'front' | 'back' | 'left' | 'right';
  index: number;
  type: 'empty' | 'door' | 'window' | 'gate';
  itemId?: string;
  canAcceptDoor?: boolean;
  isUpper?: boolean;
  /** Lower bay covered by a three-pane slider hosted on another slot. */
  coveredBy?: string;
}

export const PANEL_COUNTS = { front: 4, back: 4, left: 3, right: 3 } as const;

export function panelCountForWall(
  wallSide: 'front' | 'back' | 'left' | 'right',
  widthMm: number,
  depthMm: number
): number {
  const span = (wallSide === 'front' || wallSide === 'back') ? widthMm : depthMm;
  return span < 5300 ? 3 : 4;
}

export function panelCountsForDimensions(
  widthMm: number,
  depthMm: number
): { front: number; back: number; left: number; right: number } {
  return {
    front: panelCountForWall('front', widthMm, depthMm),
    back: panelCountForWall('back', widthMm, depthMm),
    left: panelCountForWall('left', widthMm, depthMm),
    right: panelCountForWall('right', widthMm, depthMm)
  };
}

/** Lower bay plus a separate upper panel above the mid-rail. Upper panels take windows only. */
export function createWallSlots(
  widthMm = 6040,
  depthMm = 4950
): Record<string, WallSlot> {
  const counts = panelCountsForDimensions(widthMm, depthMm);
  const slots: Record<string, WallSlot> = {};
  (Object.keys(counts) as (keyof typeof counts)[]).forEach((wall) => {
    for (let index = 0; index < counts[wall]; index += 1) {
      const id = `${wall}-${index}`;
      slots[id] = { id, wall, index, type: 'empty', canAcceptDoor: true };
      const upperId = `${id}u`;
      slots[upperId] = {
        id: upperId,
        wall,
        index,
        type: 'empty',
        canAcceptDoor: false,
        isUpper: true
      };
    }
  });
  slots['front-0'] = { ...slots['front-0'], type: 'door', itemId: 'STEHAG', canAcceptDoor: true };
  for (let index = 0; index < counts.front; index += 1) {
    const upperId = `front-${index}u`;
    slots[upperId] = { ...slots[upperId], type: 'window', itemId: 'standard-single' };
  }
  slots['front-0u'] = { ...slots['front-0u'], type: 'window', itemId: 'overlight' };
  return slots;
}

export function clearedWallSlots(
  widthMm = 6040,
  depthMm = 4950
): Record<string, WallSlot> {
  const slots = createWallSlots(widthMm, depthMm);
  for (const slot of Object.values(slots)) {
    slot.type = 'empty';
    slot.itemId = undefined;
    slot.coveredBy = undefined;
  }
  return slots;
}

/** Empty bays, then the modern cube's openings. */
export function cubeWallSlots(): Record<string, WallSlot> {
  const slots = clearedWallSlots(6000, 6000);
  slots['front-0'] = { ...slots['front-0'], type: 'door', itemId: 'LERVIK' };
  slots['front-0u'] = { ...slots['front-0u'], type: 'window', itemId: 'overlight' };
  slots['front-3'] = { ...slots['front-3'], type: 'window', itemId: 'panorama' };
  slots['front-3u'] = { ...slots['front-3u'], type: 'window', itemId: 'panorama' };
  slots['left-1'] = { ...slots['left-1'], type: 'window', itemId: 'panorama-portrait' };
  slots['right-0'] = { ...slots['right-0'], type: 'door', itemId: 'SKJUTDORR' };
  slots['right-1'] = { ...slots['right-1'], type: 'window', itemId: 'standard-single' };
  slots['back-1'] = { ...slots['back-1'], type: 'door', itemId: 'SKJUTDORR' };
  slots['back-2'] = { ...slots['back-2'], type: 'empty', itemId: undefined, coveredBy: 'back-1' };
  return slots;
}

/** A low cabin: a door, a frosted window, and solid walls. */
export function saunaWallSlots(): Record<string, WallSlot> {
  const slots = clearedWallSlots(5200, 2800);
  slots['front-0'] = { ...slots['front-0'], type: 'door', itemId: 'LERVIK' };
  slots['front-2'] = { ...slots['front-2'], type: 'window', itemId: 'frost' };
  return slots;
}

/** A small shed: one door and one window on the front. */
export function shedWallSlots(): Record<string, WallSlot> {
  const slots = clearedWallSlots(4000, 2500);
  slots['front-0'] = { ...slots['front-0'], type: 'door', itemId: 'STEHAG' };
  slots['front-2'] = { ...slots['front-2'], type: 'window', itemId: 'standard-single' };
  return slots;
}

export function defaultDimensionsForSize(sizeId?: string): { widthMm: number; depthMm: number } {
  if (sizeId === 'size-paabyggnad') return { widthMm: 5200, depthMm: 6731 };
  if (sizeId === 'size-sauna') return { widthMm: 5200, depthMm: 2800 };
  if (sizeId === 'size-shed') return { widthMm: 4000, depthMm: 2500 };
  if (sizeId === 'size-15') return { widthMm: 4800, depthMm: 3125 };
  if (sizeId === 'size-25') return { widthMm: 5800, depthMm: 4310 };
  if (sizeId === 'size-cube') return { widthMm: 6000, depthMm: 6000 };
  return { widthMm: 6040, depthMm: 4950 };
}

export function mergeWallSlots(
  saved: Record<string, WallSlot> | undefined,
  sizeId?: string,
  widthMm?: number,
  depthMm?: number
): Record<string, WallSlot> {
  const dims = defaultDimensionsForSize(sizeId);
  const w = widthMm ?? dims.widthMm;
  const d = depthMm ?? dims.depthMm;
  const isPaabyggnad = sizeId === 'size-paabyggnad';
  const slots = createWallSlots(w, d);
  if (isPaabyggnad) {
    if (slots['front-0']) {
      slots['front-0'] = {
        ...slots['front-0'],
        type: 'empty',
        itemId: undefined,
        canAcceptDoor: true
      };
    }
    if (slots['front-0u']) {
      slots['front-0u'] = {
        ...slots['front-0u'],
        type: 'window',
        itemId: 'standard-single'
      };
    }
  }
  if (!saved) return slots;
  for (const [id, slot] of Object.entries(saved)) {
    if (!slot || typeof slot !== 'object') continue;
    const wall = slot.wall;
    const maxCount = panelCountForWall(wall, w, d);
    if (slot.index >= maxCount) continue;
    if (slot.isUpper && !id.endsWith('u')) {
      const upperId = `${id}u`;
      if (slots[upperId] && slot.type === 'window') {
        slots[upperId] = {
          ...slots[upperId],
          type: 'window',
          itemId: slot.itemId,
          isUpper: true,
          canAcceptDoor: false
        };
      }
      slots[id] = {
        ...slots[id],
        type: slot.type === 'window' ? 'empty' : slot.type,
        itemId: slot.type === 'window' ? undefined : slot.itemId,
        isUpper: false,
        canAcceptDoor: true
      };
      continue;
    }
    const upper = id.endsWith('u') || slot.isUpper === true;
    slots[id] = {
      ...slot,
      id,
      isUpper: upper,
      canAcceptDoor: !upper
    };
  }
  for (const slot of Object.values(slots)) {
    if (slot.type !== 'window' || !slot.isUpper) continue;
    const lower = slots[slot.id.replace(/u$/, '')];
    const aboveDoor = lower?.type === 'door';
    slot.itemId = overlightItem(slot.itemId, aboveDoor, lower?.itemId);
  }
  return slots;
}
