export interface WallSlotLike {
  id: string;
  wall: 'front' | 'back' | 'left' | 'right';
  index: number;
  type: 'empty' | 'door' | 'window' | 'gate';
  itemId?: string;
  canAcceptDoor?: boolean;
  isUpper?: boolean;
  coveredBy?: string;
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
  slot.coveredBy = undefined;
  const host = wallSlots[hostId];
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

  releaseWideDoorSlots(wallSlots, fromId);
  releaseWideDoorSlots(wallSlots, toId);

  from.type = toType;
  from.itemId = toItemId;
  from.coveredBy = undefined;

  to.type = fromType;
  to.itemId = fromItemId;
  to.coveredBy = undefined;

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
