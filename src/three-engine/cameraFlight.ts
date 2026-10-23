import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CameraView } from '../store/useConfigStore';

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

export function motionReduced(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface CameraFlight {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  started: number;
  duration: number;
  minDistance: number;
  near: number;
  restoreMin: number;
  restoreNear: number;
}

export function captureCameraView(camera: THREE.Camera, controls: OrbitControls): CameraView {
  return {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    tx: controls.target.x,
    ty: controls.target.y,
    tz: controls.target.z
  };
}

export type FacingSide = 'front' | 'back' | 'left' | 'right';

export type FacingOverhang = Partial<Record<FacingSide, number>>;

/** Calculate camera position and target height for taking still facing snapshots. */
export function calculateFacingPose(
  facing: FacingSide,
  widthMm = 6000,
  depthMm = 4000,
  heightMm = 4000,
  overhang: FacingOverhang = {}
): { cameraPosition: [number, number, number]; targetY: number } {
  const width = Math.max((widthMm || 6000) / 1000, 4);
  const depth = Math.max((depthMm || 4000) / 1000, 3);
  const height = Math.max((heightMm || 4000) / 1000, 2.4);
  const out = Math.max(0, overhang[facing] ?? 0);
  // Pull back far enough that a deep terrace with sauna/tub still fits in frame.
  const dist = Math.max(width, depth) * 1.05 + 3.5 + out * 1.15 + 1.2;
  const skew = dist * 0.36;
  const y = Math.max(3.8, height * 0.92);
  const lookY = Math.max(1.6, height * 0.45);
  const poses: Record<FacingSide, [number, number, number]> = {
    front: [skew, y, dist],
    back: [-skew, y, -dist],
    left: [-dist, y, skew],
    right: [dist, y, -skew]
  };
  return {
    cameraPosition: poses[facing],
    targetY: lookY
  };
}

/**
 * Elevated 3/4 view that shows the whole shell plus terraces, sauna, and hot tub.
 * Used as a second house reference for site placement renders.
 */
export function calculateOverviewPose(
  widthMm = 6000,
  depthMm = 4000,
  heightMm = 4000,
  overhang: FacingOverhang = {}
): { cameraPosition: [number, number, number]; targetY: number } {
  const width = Math.max((widthMm || 6000) / 1000, 4);
  const depth = Math.max((depthMm || 4000) / 1000, 3);
  const height = Math.max((heightMm || 4000) / 1000, 2.4);
  const maxOut = Math.max(0, overhang.front ?? 0, overhang.back ?? 0, overhang.left ?? 0, overhang.right ?? 0);
  const dist = Math.max(width, depth) * 1.35 + 5.5 + maxOut * 1.1;
  const y = Math.max(5.2, height * 1.15 + 2.2);
  return {
    cameraPosition: [dist * 0.82, y, dist * 0.95],
    targetY: Math.max(1.4, height * 0.38)
  };
}

/** Step the camera flight interpolation forward. Returns false when finished. */
export function stepCameraFlight(
  flight: CameraFlight,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls
): boolean {
  const t = Math.min(1, (performance.now() - flight.started) / flight.duration);
  const eased = easeInOutCubic(t);
  camera.position.lerpVectors(flight.fromPos, flight.toPos, eased);
  controls.target.lerpVectors(flight.fromTarget, flight.toTarget, eased);
  if (t < 1) return true;
  controls.minDistance = flight.minDistance;
  camera.near = flight.near;
  camera.updateProjectionMatrix();
  return false;
}
