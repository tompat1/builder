import * as THREE from 'three';
import { compassDialDegrees, sunPlacement } from './sunPosition';

export interface SceneLighting {
  sunLight: THREE.DirectionalLight;
  skyFill: THREE.DirectionalLight;
  sunTarget: THREE.Object3D;
  groundMesh: THREE.Mesh;
}

/** Set up ambient, directional sun, interior fill, ground plane, and grid for the scene. */
export function createSceneLighting(scene: THREE.Scene): SceneLighting {
  const hemisphere = new THREE.HemisphereLight(0xf7f4ee, 0xd5dde6, 0.62);
  scene.add(hemisphere);

  const ambientLight = new THREE.AmbientLight(0xfffaf3, 0.28);
  scene.add(ambientLight);

  const sunTarget = new THREE.Object3D();
  sunTarget.position.set(0, 1.4, 0);
  scene.add(sunTarget);

  const sunLight = new THREE.DirectionalLight(0xfff3e4, 1.55);
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

  const interiorFill = new THREE.PointLight(0xfff6ea, 0.55, 14, 2);
  interiorFill.position.set(0, 1.7, 0);
  scene.add(interiorFill);

  const skyFill = new THREE.DirectionalLight(0xdbeafe, 0.28);
  skyFill.position.set(-10, 12, -8);
  scene.add(skyFill);

  // Ground platform
  const groundGeo = new THREE.PlaneGeometry(70, 70);
  const groundMat = new THREE.MeshStandardMaterial({
    color: '#f1f5f9',
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

  return { sunLight, skyFill, sunTarget, groundMesh };
}

/** Update the sun position, color temperature, and shadow intensity according to sun hour and facing. */
export function updateSunPosition(
  sunLight: THREE.DirectionalLight,
  skyFill: THREE.DirectionalLight,
  sunTarget: THREE.Object3D,
  sunHour: number,
  facingDeg: number
): boolean {
  const placement = sunPlacement(sunHour, facingDeg);
  const dir = new THREE.Vector3(placement.x, placement.y, placement.z);
  const sunUp = placement.altitude > 0.02;
  const aim = sunUp
    ? dir
    : new THREE.Vector3(dir.x, 0.05, dir.z).normalize();
  sunLight.position.copy(sunTarget.position).addScaledVector(aim, 28);
  const gain = Math.min(1, Math.max(0, placement.y) / 0.5);
  const warm = new THREE.Color('#ff9a3c');
  const noon = new THREE.Color('#fff3e4');
  sunLight.color.copy(warm).lerp(noon, gain);
  sunLight.intensity = sunUp ? 0.4 + 1.3 * gain * gain : 0.08;
  sunLight.castShadow = sunUp;
  skyFill.position.set(-dir.x * 14, 12, -dir.z * 14);
  return sunUp;
}

/** Calculate compass heading in degrees from camera world direction. */
export function calculateCompassHeading(camera: THREE.Camera, facingDeg: number): number {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  return Math.round(compassDialDegrees(forward, facingDeg));
}
