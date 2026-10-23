import * as THREE from 'three';

export interface TerraceHotTubOptions {
  bX: number;
  bW: number;
  bD: number;
  deckTop: number;
  outward: number;
  isLeft: boolean;
}

/** Clear gap from the house wall face to the nearest tub stave. */
export const HOT_TUB_WALL_CLEARANCE_M = 1;

/**
 * Tub radius and distance from the wall to the tub centre.
 * Always keeps {@link HOT_TUB_WALL_CLEARANCE_M} clear of the wall; shrinks the
 * tub if the deck is too shallow to hold clearance + diameter.
 */
export function hotTubPlacementFromWall(
  bW: number,
  bD: number,
  clearance = HOT_TUB_WALL_CLEARANCE_M
): { radius: number; centreFromWall: number } {
  let radius = Math.min(1, bW * 0.45, bD * 0.45);
  const needed = clearance + 2 * radius;
  if (needed > bD && bD > clearance + 0.4) {
    radius = Math.max(0.4, (bD - clearance) / 2);
  }
  return { radius, centreFromWall: clearance + radius };
}

const shadow = (mesh: THREE.Mesh) => {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

/**
 * Round cedar hot tub with the product-defining details from the supplied
 * references: stave shell, steel hoops, submerged seating, internal stove,
 * timber heat guard, and a tall flue.
 */
export function addTerraceHotTub(group: THREE.Group, options: TerraceHotTubOptions) {
  const { bX, bW, bD, deckTop, outward, isLeft } = options;
  const tub = new THREE.Group();
  tub.name = 'terrace-hot-tub';

  const { radius, centreFromWall } = hotTubPlacementFromWall(bW, bD);
  const height = Math.max(0.94, Math.min(1.12, radius * 1.14));
  const centreZ = outward * centreFromWall;
  tub.position.set(bX, deckTop, centreZ);

  const woodColors = ['#a94f24', '#bf6932', '#d18445', '#9a421f', '#c87538'];
  const woods = woodColors.map((color) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.68,
    metalness: 0.01
  }));
  const darkWood = new THREE.MeshStandardMaterial({ color: '#713319', roughness: 0.76 });
  const innerWood = new THREE.MeshStandardMaterial({
    color: '#b9602e',
    roughness: 0.7,
    side: THREE.BackSide
  });
  const steel = new THREE.MeshStandardMaterial({ color: '#aeb3b2', roughness: 0.28, metalness: 0.9 });
  const stoveMetal = new THREE.MeshStandardMaterial({ color: '#20262a', roughness: 0.3, metalness: 0.82 });
  const water = new THREE.MeshPhysicalMaterial({
    color: '#244f55',
    roughness: 0.12,
    metalness: 0.02,
    transparent: true,
    opacity: 0.76,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08
  });

  const staveCount = 36;
  const staveWidth = (Math.PI * 2 * radius) / staveCount * 0.92;
  const staveDepth = 0.09;
  const staveGeometry = new THREE.BoxGeometry(staveWidth, height, staveDepth);
  for (let index = 0; index < staveCount; index += 1) {
    const angle = (index / staveCount) * Math.PI * 2;
    const stave = shadow(new THREE.Mesh(staveGeometry, woods[index % woods.length]));
    stave.position.set(
      Math.cos(angle) * (radius - staveDepth / 2),
      height / 2,
      -Math.sin(angle) * (radius - staveDepth / 2)
    );
    stave.rotation.y = angle + Math.PI / 2;
    tub.add(stave);
  }

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(radius - 0.1, radius - 0.1, height - 0.12, 48, 1, true),
    innerWood
  );
  inner.position.y = height / 2 + 0.01;
  inner.receiveShadow = true;
  tub.add(inner);

  for (const y of [0.25, 0.61, 0.94]) {
    const hoop = shadow(new THREE.Mesh(
      new THREE.TorusGeometry(radius + 0.012, 0.022, 8, 64),
      steel
    ));
    hoop.position.y = Math.min(y, height - 0.12);
    hoop.rotation.x = Math.PI / 2;
    tub.add(hoop);
  }

  const topRim = shadow(new THREE.Mesh(
    new THREE.TorusGeometry(radius - 0.025, 0.055, 10, 64),
    woods[2]
  ));
  topRim.position.y = height + 0.015;
  topRim.rotation.x = Math.PI / 2;
  tub.add(topRim);

  const waterSurface = new THREE.Mesh(
    new THREE.CylinderGeometry(radius - 0.13, radius - 0.13, 0.025, 64),
    water
  );
  waterSurface.position.y = height - 0.19;
  waterSurface.receiveShadow = true;
  tub.add(waterSurface);

  const benchGeometry = new THREE.BoxGeometry(0.29, 0.065, 0.38);
  for (let index = 0; index < 11; index += 1) {
    const angle = -Math.PI * 0.74 + (index / 10) * Math.PI * 1.48;
    const bench = shadow(new THREE.Mesh(benchGeometry, woods[(index + 1) % woods.length]));
    bench.position.set(
      Math.cos(angle) * (radius - 0.38),
      height * 0.47,
      -Math.sin(angle) * (radius - 0.38)
    );
    bench.rotation.y = angle;
    tub.add(bench);
  }

  const stoveSide = isLeft ? -1 : 1;
  const stoveX = stoveSide * radius * 0.47;
  const stoveZ = outward * radius * 0.33;
  const stove = shadow(new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.66, 0.48),
    stoveMetal
  ));
  stove.position.set(stoveX, 0.36, stoveZ);
  tub.add(stove);

  const stoveTop = shadow(new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.04, 0.52),
    steel
  ));
  stoveTop.position.set(stoveX, 0.71, stoveZ);
  tub.add(stoveTop);

  const flueHeight = 1.7;
  const flue = shadow(new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.065, flueHeight, 18),
    stoveMetal
  ));
  flue.position.set(stoveX, 0.72 + flueHeight / 2, stoveZ + outward * 0.05);
  tub.add(flue);

  const cap = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.07, 0.06, 18), stoveMetal));
  cap.position.set(stoveX, 0.75 + flueHeight, stoveZ + outward * 0.05);
  tub.add(cap);

  const guardDirection = -stoveSide;
  for (let index = -2; index <= 2; index += 1) {
    const guard = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.78, 0.07), woods[(index + 7) % woods.length]));
    guard.position.set(
      stoveX + guardDirection * 0.27,
      0.42,
      stoveZ + index * 0.105
    );
    tub.add(guard);
  }
  for (const y of [0.12, 0.73]) {
    const rail = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.055, 0.5), darkWood));
    rail.position.set(stoveX + guardDirection * 0.27, y, stoveZ);
    tub.add(rail);
  }

  const stepDirection = isLeft ? 1 : -1;
  for (let index = 0; index < 3; index += 1) {
    const stepHeight = 0.16 * (index + 1);
    const step = shadow(new THREE.Mesh(
      new THREE.BoxGeometry(0.3, stepHeight, 0.64),
      woods[(index + 2) % woods.length]
    ));
    step.position.set(
      stepDirection * (radius + 0.44 - index * 0.15),
      stepHeight / 2,
      -outward * 0.02
    );
    tub.add(step);
  }

  group.add(tub);
}
