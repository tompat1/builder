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

  return { sunLight, skyFill, sunTarget, groundMesh, hemisphere, ambient, interiorFill };
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
    nightGain = 0;
    sunUp = true;
  } else {
    nightGain = nightGainForHour(sunHour, placement.altitude);
    sunUp = nightGain < 0.85 && placement.altitude > 0.02;
  }

  const aim =
    mode === 'neutral'
      ? new THREE.Vector3(0.35, 0.85, 0.4).normalize()
      : sunUp
        ? dir
        : new THREE.Vector3(dir.x, mode === 'moon' ? 0.35 : 0.05, dir.z).normalize();

  sunLight.position.copy(sunTarget.position).addScaledVector(aim, mode === 'moon' ? 22 : 28);

  const dayGain = mode === 'neutral' ? 1 : Math.min(1, Math.max(0, placement.y) / 0.5);
  const warm = new THREE.Color('#ff9a3c');
  const noon = new THREE.Color('#fff3e4');
  const moon = new THREE.Color('#9eb6d4');

  if (mode === 'moon') {
    sunLight.color.copy(moon);
    sunLight.intensity = 0.18;
    sunLight.castShadow = false;
  } else if (mode === 'neutral') {
    sunLight.color.copy(noon);
    sunLight.intensity = 1.15;
    sunLight.castShadow = true;
  } else {
    sunLight.color.copy(warm).lerp(noon, dayGain);
    sunLight.intensity = sunUp
      ? (0.4 + 1.3 * dayGain * dayGain) * (1 - nightGain * 0.85)
      : 0.06;
    sunLight.castShadow = sunUp && nightGain < 0.5;
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

  return { sunUp, nightGain };
}

/** Calculate compass heading in degrees from camera world direction. */
export function calculateCompassHeading(camera: THREE.Camera, facingDeg: number): number {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  return Math.round(compassDialDegrees(forward, facingDeg));
}
