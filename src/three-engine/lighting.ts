import * as THREE from 'three';
import {
  fixtureLightIntensity,
  nightGainForHour,
  type DaylightMode
} from '../outside/houseLights';
import { compassDialDegrees, sunPlacement } from './sunPosition';

export { fixtureLightIntensity, nightGainForHour };

export interface SceneLighting {
  sunLight: THREE.DirectionalLight;
  skyFill: THREE.DirectionalLight;
  sunTarget: THREE.Object3D;
  groundMesh: THREE.Mesh;
  hemisphere: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
  interiorFill: THREE.PointLight;
  starfield: THREE.Points;
}

export interface DaylightResult {
  sunUp: boolean;
  /** 0 = full day, 1 = full night — scales exterior fixture PointLights. */
  nightGain: number;
}

const DAY = {
  hemisphere: 0.62,
  ambient: 0.28,
  skyFill: 0.28,
  interior: 0.55,
  sun: 1.55,
  bg: '#f3f5f7',
  ground: '#f1f5f9'
};

const NIGHT = {
  hemisphere: 0.12,
  ambient: 0.06,
  skyFill: 0.04,
  interior: 0.22,
  sun: 0.06,
  bg: '#0b1220',
  ground: '#1a2332'
};

/** Set up ambient, directional sun, interior fill, ground plane, and grid for the scene. */
export function createSceneLighting(scene: THREE.Scene): SceneLighting {
  const hemisphere = new THREE.HemisphereLight(0xf7f4ee, 0xd5dde6, DAY.hemisphere);
  scene.add(hemisphere);

  const ambient = new THREE.AmbientLight(0xfffaf3, DAY.ambient);
  scene.add(ambient);

  const sunTarget = new THREE.Object3D();
  sunTarget.position.set(0, 1.4, 0);
  scene.add(sunTarget);

  const sunLight = new THREE.DirectionalLight(0xfff3e4, DAY.sun);
  sunLight.target = sunTarget;
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 80;
  sunLight.shadow.camera.left = -18;
  sunLight.shadow.camera.right = 18;
  sunLight.shadow.camera.top = 18;
  sunLight.shadow.camera.bottom = -18;
  sunLight.shadow.bias = -0.0002;
  sunLight.shadow.normalBias = 0.025;
  sunLight.shadow.radius = 5;
  sunLight.shadow.camera.updateProjectionMatrix();
  scene.add(sunLight);

  const interiorFill = new THREE.PointLight(0xfff6ea, DAY.interior, 14, 2);
  interiorFill.position.set(0, 1.7, 0);
  scene.add(interiorFill);

  const skyFill = new THREE.DirectionalLight(0xdbeafe, DAY.skyFill);
  skyFill.position.set(-10, 12, -8);
  scene.add(skyFill);

  const groundGeo = new THREE.PlaneGeometry(70, 70);
  const groundMat = new THREE.MeshStandardMaterial({
    color: DAY.ground,
    roughness: 0.95
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = -0.02;
  groundMesh.receiveShadow = true;
  groundMesh.userData.isGround = true;
  scene.add(groundMesh);

  const grid = new THREE.GridHelper(40, 40, '#cbd5e1', '#e2e8f0');
  grid.position.y = 0;
  scene.add(grid);

  const starfield = createStarfield(scene);

  return { sunLight, skyFill, sunTarget, groundMesh, hemisphere, ambient, interiorFill, starfield };
}

/** Distant star points for night / moon — opacity follows nightGain. */
export function createStarfield(scene: THREE.Scene): THREE.Points {
  const count = 1400;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const radius = 90;
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    // Bias toward the upper sky dome.
    const phi = Math.acos(1 - v * 0.92);
    const r = radius * (0.88 + Math.random() * 0.12);
    const y = Math.abs(r * Math.cos(phi)) + 8;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    const warm = Math.random() > 0.85;
    const bright = 0.65 + Math.random() * 0.35;
    colors[i * 3] = bright;
    colors[i * 3 + 1] = warm ? bright * 0.92 : bright;
    colors[i * 3 + 2] = warm ? bright * 0.75 : bright * (0.95 + Math.random() * 0.05);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.42,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const stars = new THREE.Points(geo, mat);
  stars.name = 'starfield';
  stars.frustumCulled = false;
  stars.visible = false;
  stars.renderOrder = -1;
  scene.add(stars);
  return stars;
}

export function syncStarfield(stars: THREE.Points | null | undefined, nightGain: number) {
  if (!stars) return;
  const mat = stars.material as THREE.PointsMaterial;
  const show = nightGain > 0.28;
  stars.visible = show;
  mat.opacity = show ? Math.min(1, (nightGain - 0.28) / 0.5) : 0;
}

/** Update sun / sky / ambient for sun, moon, or neutral daylight. */
export function updateSunPosition(
  sunLight: THREE.DirectionalLight,
  skyFill: THREE.DirectionalLight,
  sunTarget: THREE.Object3D,
  sunHour: number,
  facingDeg: number,
  mode: DaylightMode = 'sun',
  extras?: {
    hemisphere?: THREE.HemisphereLight;
    ambient?: THREE.AmbientLight;
    interiorFill?: THREE.PointLight;
    groundMesh?: THREE.Mesh | null;
    scene?: THREE.Scene | null;
    starfield?: THREE.Points | null;
  }
): DaylightResult {
  const placement = sunPlacement(sunHour, facingDeg);
  const dir = new THREE.Vector3(placement.x, placement.y, placement.z);

  let nightGain = 0;
  let sunUp = placement.altitude > 0.02;

  if (mode === 'moon') {
    nightGain = 1;
    sunUp = false;
  } else if (mode === 'neutral') {
    // Even studio-style fill — no sun beam, so north faces stay readable.
    nightGain = 0;
    sunUp = false;
  } else {
    nightGain = nightGainForHour(sunHour, placement.altitude);
    sunUp = nightGain < 0.85 && placement.altitude > 0.02;
  }

  const aim = sunUp
    ? dir
    : new THREE.Vector3(dir.x, mode === 'moon' ? 0.35 : 0.05, dir.z).normalize();

  sunLight.position.copy(sunTarget.position).addScaledVector(aim, mode === 'moon' ? 22 : 28);

  const dayGain = Math.min(1, Math.max(0, placement.y) / 0.5);
  const warm = new THREE.Color('#ff9a3c');
  const noon = new THREE.Color('#fff3e4');
  const moon = new THREE.Color('#9eb6d4');

  if (mode === 'moon') {
    sunLight.color.copy(moon);
    sunLight.intensity = 0.18;
    sunLight.castShadow = false;
  } else if (mode === 'neutral') {
    sunLight.color.copy(noon);
    sunLight.intensity = 0;
    sunLight.castShadow = false;
  } else {
    sunLight.color.copy(warm).lerp(noon, dayGain);
    sunLight.intensity = sunUp
      ? (0.4 + 1.3 * dayGain * dayGain) * (1 - nightGain * 0.85)
      : 0.06;
    sunLight.castShadow = sunUp && nightGain < 0.5;
  }

  if (mode === 'neutral') {
    // Soft omnidirectional fill so every facade reads equally.
    skyFill.position.set(0, 14, 0);
    skyFill.intensity = 0.42;
    skyFill.color.set('#e8eef5');
    if (extras?.hemisphere) {
      extras.hemisphere.intensity = 0.98;
      extras.hemisphere.color.set('#f5f7fa');
      extras.hemisphere.groundColor.set('#e2e8f0');
    }
    if (extras?.ambient) {
      extras.ambient.intensity = 0.62;
      extras.ambient.color.set('#ffffff');
    }
    if (extras?.interiorFill) {
      extras.interiorFill.intensity = 0.48;
    }
    if (extras?.groundMesh?.material && 'color' in extras.groundMesh.material) {
      (extras.groundMesh.material as THREE.MeshStandardMaterial).color.set(DAY.ground);
    }
    if (extras?.scene) {
      extras.scene.background = new THREE.Color(DAY.bg);
    }
    syncStarfield(extras?.starfield, 0);
    return { sunUp: false, nightGain: 0 };
  }

  skyFill.position.set(-aim.x * 14, 12, -aim.z * 14);
  skyFill.intensity = THREE.MathUtils.lerp(DAY.skyFill, NIGHT.skyFill, nightGain);
  skyFill.color.set(nightGain > 0.5 ? '#1e3a5f' : '#dbeafe');

  if (extras?.hemisphere) {
    extras.hemisphere.intensity = THREE.MathUtils.lerp(DAY.hemisphere, NIGHT.hemisphere, nightGain);
    extras.hemisphere.color.set(nightGain > 0.5 ? '#1a2740' : '#f7f4ee');
    extras.hemisphere.groundColor.set(nightGain > 0.5 ? '#0d1520' : '#d5dde6');
  }
  if (extras?.ambient) {
    extras.ambient.intensity = THREE.MathUtils.lerp(DAY.ambient, NIGHT.ambient, nightGain);
    extras.ambient.color.set(nightGain > 0.5 ? '#1a2233' : '#fffaf3');
  }
  if (extras?.interiorFill) {
    extras.interiorFill.intensity = THREE.MathUtils.lerp(DAY.interior, NIGHT.interior, nightGain);
  }
  if (extras?.groundMesh?.material && 'color' in extras.groundMesh.material) {
    (extras.groundMesh.material as THREE.MeshStandardMaterial).color.set(
      nightGain > 0.5 ? NIGHT.ground : DAY.ground
    );
  }
  if (extras?.scene) {
    extras.scene.background = new THREE.Color(nightGain > 0.5 ? NIGHT.bg : DAY.bg);
  }
  syncStarfield(extras?.starfield, nightGain);

  return { sunUp, nightGain };
}

/** Calculate compass heading in degrees from camera world direction. */
export function calculateCompassHeading(camera: THREE.Camera, facingDeg: number): number {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  return Math.round(compassDialDegrees(forward, facingDeg));
}
