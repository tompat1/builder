/** A post-it lies in the plane of the panel it was stuck to. */

export interface NoteNormal {
  x: number;
  y: number;
  z: number;
}

export interface NoteAxes {
  right: NoteNormal;
  up: NoteNormal;
  face: NoteNormal;
}

const NOTE_WIDTH_M = 1.6;
/** Fresh paper width in CSS pixels. Keep this equal to NOTE_WIDTH in board.ts. */
const NOTE_PAPER_PX = 176;

/** World size of the paper divided by its CSS width, so the sheet stays on the wall. */
export const NOTE_SURFACE_SCALE = NOTE_WIDTH_M / NOTE_PAPER_PX;

/** Wall and roof faces are square to the house. A noisy hit should not tilt the sheet. */
export function stickFacing(normal: NoteNormal): NoteNormal {
  const length = Math.hypot(normal.x, normal.y, normal.z) || 1;
  const x = normal.x / length;
  const y = normal.y / length;
  const z = normal.z / length;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const az = Math.abs(z);
  const max = Math.max(ax, ay, az);
  if (max < 0.92) return { x, y, z };
  if (ax === max) return { x: Math.sign(x) || 1, y: 0, z: 0 };
  if (ay === max) return { x: 0, y: Math.sign(y) || 1, z: 0 };
  return { x: 0, y: 0, z: Math.sign(z) || 1 };
}

/** A small roll so each sheet is not perfectly square to the boards. */
export function noteTiltRadians(id: string) {
  let sum = 0;
  for (const char of id) sum += char.charCodeAt(0);
  return ((sum % 5) - 2) * 0.7 * Math.PI / 180;
}

function unit(vector: NoteNormal): NoteNormal {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}

/** Right, up, and outward face for a sheet stuck to a surface. */
export function noteAxes(normal: NoteNormal): NoteAxes {
  const face = unit(normal);
  let hint = { x: 0, y: 1, z: 0 };
  if (Math.abs(face.y) > 0.85) hint = { x: 0, y: 0, z: -1 };
  const drop = face.x * hint.x + face.y * hint.y + face.z * hint.z;
  const up = unit({
    x: hint.x - drop * face.x,
    y: hint.y - drop * face.y,
    z: hint.z - drop * face.z
  });
  return {
    right: {
      x: up.y * face.z - up.z * face.y,
      y: up.z * face.x - up.x * face.z,
      z: up.x * face.y - up.y * face.x
    },
    up,
    face
  };
}

/** Older saved notes have a point and no facing. Pick the nearest house face. */
export function inferNoteNormal(
  pin: NoteNormal,
  house: { widthM: number; depthM: number; heightM: number }
): NoteNormal {
  const halfWidth = house.widthM / 2;
  const halfDepth = house.depthM / 2;
  const faces = [
    { distance: Math.abs(halfDepth - pin.z), normal: { x: 0, y: 0, z: 1 } },
    { distance: Math.abs(-halfDepth - pin.z), normal: { x: 0, y: 0, z: -1 } },
    { distance: Math.abs(halfWidth - pin.x), normal: { x: 1, y: 0, z: 0 } },
    { distance: Math.abs(-halfWidth - pin.x), normal: { x: -1, y: 0, z: 0 } },
    { distance: Math.abs(house.heightM - pin.y), normal: { x: 0, y: 1, z: 0 } }
  ];
  faces.sort((a, b) => a.distance - b.distance);
  return faces[0].normal;
}

function epsilon(value: number) {
  return Math.abs(value) < 1e-10 ? 0 : value;
}

/** Same camera mapping CSS3D uses, so a child sheet shares the WebGL view. */
export function noteCameraTransform(elements: ArrayLike<number>, fovPx: number, width: number, height: number) {
  const matrix = `matrix3d(${[
    epsilon(elements[0]), epsilon(-elements[1]), epsilon(elements[2]), epsilon(elements[3]),
    epsilon(elements[4]), epsilon(-elements[5]), epsilon(elements[6]), epsilon(elements[7]),
    epsilon(elements[8]), epsilon(-elements[9]), epsilon(elements[10]), epsilon(elements[11]),
    epsilon(elements[12]), epsilon(-elements[13]), epsilon(elements[14]), epsilon(elements[15])
  ].join(',')})`;
  return `perspective(${fovPx}px) translateZ(${fovPx}px)${matrix}translate(${width / 2}px,${height / 2}px)`;
}

/** Sheet transform. The percentage shift centres the paper on the stuck point. */
export function noteSheetTransform(elements: ArrayLike<number>) {
  const matrix = `matrix3d(${[
    epsilon(elements[0]), epsilon(elements[1]), epsilon(elements[2]), epsilon(elements[3]),
    epsilon(-elements[4]), epsilon(-elements[5]), epsilon(-elements[6]), epsilon(-elements[7]),
    epsilon(elements[8]), epsilon(elements[9]), epsilon(elements[10]), epsilon(elements[11]),
    epsilon(elements[12]), epsilon(elements[13]), epsilon(elements[14]), epsilon(elements[15])
  ].join(',')})`;
  return `translate(-50%,-50%)${matrix}`;
}
