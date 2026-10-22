export interface WallSlotLike {
  id: string;
  wall: 'front' | 'back' | 'left' | 'right';
  index: number;
  type: 'empty' | 'door' | 'window' | 'gate';
  itemId?: string;
  canAcceptDoor?: boolean;
  isUpper?: boolean;
  coveredBy?: string;
  fitToWall?: boolean;
  windowRhythm?: 2 | 3 | 4;
}

export function clearWindowRhythmSlots(wallSlots: Record<string, WallSlotLike>, hostId: string) {
  const host = wallSlots[hostId];
  if (!host) return;
  if (host.windowRhythm) {
    host.windowRhythm = undefined;
    host.type = 'empty';
    host.itemId = undefined;
    host.fitToWall = undefined;
  }
  for (const other of Object.values(wallSlots)) {
    if (other.coveredBy === hostId) {
      other.coveredBy = undefined;
    }
  }
}

export function releaseWindowRhythmSlots(wallSlots: Record<string, WallSlotLike>, slotId: string) {
  const slot = wallSlots[slotId];
  if (!slot) return;
  if (slot.windowRhythm) {
    clearWindowRhythmSlots(wallSlots, slotId);
    return;
  }
  if (slot.coveredBy) {
    const host = wallSlots[slot.coveredBy];
    if (host?.windowRhythm) clearWindowRhythmSlots(wallSlots, slot.coveredBy);
  }
}

export function releaseWideDoorSlots(wallSlots: Record<string, WallSlotLike>, slotId: string) {
  const slot = wallSlots[slotId];
  if (!slot) return;
  if (slot.itemId === 'SKJUTDORR' || slot.itemId === 'SKJUTDORR3') {
    for (const other of Object.values(wallSlots)) {
      if (other.coveredBy === slotId) other.coveredBy = undefined;
    }
  }
  const hostId = slot.coveredBy;
  if (!hostId) return;
  const host = wallSlots[hostId];
  if (host?.windowRhythm) return;
  slot.coveredBy = undefined;
  if (host?.itemId !== 'SKJUTDORR' && host?.itemId !== 'SKJUTDORR3') return;
  host.type = 'empty';
  host.itemId = undefined;
  for (const other of Object.values(wallSlots)) {
    if (other.coveredBy === hostId) other.coveredBy = undefined;
  }
}

export function moveWallSlot(wallSlots: Record<string, WallSlotLike>, fromId: string, toId: string): boolean {
  const from = wallSlots[fromId];
  const to = wallSlots[toId];
  if (!from || !to || fromId === toId || from.type === 'empty') return false;

  // Doors and gates cannot be placed on upper bays
  const toUpper = to.isUpper === true || toId.endsWith('u') || to.canAcceptDoor === false;
  if ((from.type === 'door' || from.type === 'gate') && toUpper) {
    return false;
  }

  const fromType = from.type;
  const fromItemId = from.itemId;
  const toType = to.type;
  const toItemId = to.itemId;

  // If target has an item, verify if it can move to source
  const fromUpper = from.isUpper === true || fromId.endsWith('u') || from.canAcceptDoor === false;
  if (toType !== 'empty' && (toType === 'door' || toType === 'gate') && fromUpper) {
    return false;
  }

  releaseWindowRhythmSlots(wallSlots, fromId);
  releaseWindowRhythmSlots(wallSlots, toId);
  releaseWideDoorSlots(wallSlots, fromId);
  releaseWideDoorSlots(wallSlots, toId);

  from.type = toType;
  from.itemId = toItemId;
  from.coveredBy = undefined;
  from.windowRhythm = undefined;

  to.type = fromType;
  to.itemId = fromItemId;
  to.coveredBy = undefined;
  to.windowRhythm = undefined;
  to.fitToWall = to.type === 'window' ? true : undefined;
  from.fitToWall = from.type === 'window' ? true : undefined;

  for (const [id, item] of [[toId, fromItemId], [fromId, toItemId]] as const) {
    const slot = wallSlots[id];
    if ((item === 'SKJUTDORR' || item === 'SKJUTDORR3') && slot && !slot.isUpper) {
      const count = slot.wall === 'front' || slot.wall === 'back' ? 4 : 3;
      const partnerIndex = slot.index + 1 < count ? slot.index + 1 : slot.index - 1;
      const partner = wallSlots[`${slot.wall}-${partnerIndex}`];
      if (partner && !partner.isUpper) {
        releaseWideDoorSlots(wallSlots, partner.id);
        partner.type = 'empty';
        partner.itemId = undefined;
        partner.coveredBy = id;
      }
    }
  }

  return true;
}
