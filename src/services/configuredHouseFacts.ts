import type { useConfigStore } from '../store/useConfigStore';
import { siteHouseFacts } from './siteHouseFacts';

type ConfigStore = ReturnType<typeof useConfigStore>;

/** One authoritative description shared by site and house-only renders. */
export function configuredHouseFacts(store: ConfigStore) {
  const dimensions = store.dimensions;
  let wallDesc = '';
  if (store.selectedSizeId === 'size-paabyggnad') {
    const concreteColor = store.concreteColor || '#b7b3ac';
    const timberColor = store.customPaint?.hex || store.currentMaterial?.colorHex || '#1e293b';
    wallDesc = `ground floor in concrete walls (${concreteColor}), upper level in vertical timber cladding (${timberColor})`;
  } else {
    wallDesc = store.customPaint
      ? `custom painted timber (${store.customPaint.hex})`
      : `${store.currentMaterial.name} timber cladding`;
  }

  return siteHouseFacts({
    sizeName: store.currentSize.name,
    widthMm: dimensions.width,
    depthMm: dimensions.depth,
    heightMm: dimensions.height,
    roofType: store.activeRoof,
    roofCovering: store.roofCovering || 'metal',
    wallDesc,
    terraces: store.terraces.map((deck) => ({
      side: deck.side,
      depth: deck.depth,
      building: deck.building,
      buildingColor: deck.buildingColor,
      buildingDoor: deck.buildingDoor,
      buildingWindow: deck.buildingWindow,
      hotTub: deck.hotTub
    }))
  });
}
