/**
 * Door rig for the Builder logo loading animation.
 *
 * The logo is isometric, so the door is a rigid 3D slab projected
 * orthographically with axes measured from the artwork's own door opening.
 * The only animated transform is a rotation about the left hinge; everything
 * else in the logo stays still.
 *
 * World space (units = artwork pixels along each axis):
 *   +X along the wall, hinge → latch side   (screen up-right)
 *   +Y up                                   (screen up)
 *   +Z out of the wall, towards the viewer  (screen down-right)
 */
export type V2 = [number, number];
type V3 = [number, number, number];
type RGB = [number, number, number];

export type DoorFace = { d: string; fill: string };
export type DoorFrame = {
  /** Door parts in front of the wall plane (always visible). */
  front: DoorFace[];
  /** Door parts behind the wall plane (only visible through the opening). */
  behind: DoorFace[];
  /** Cast shadow on the wall plane, as an SVG path. */
  shadow: string;
  /** 0 → 1 while the opening becomes visible. */
  reveal: number;
  /** 0 (closed) → 1 (perpendicular): how far the door sticks out. */
  swing: number;
};

export type DoorRigSpec = {
  /** Door opening, ordered bottom-hinge, bottom-latch, top-latch, top-hinge. */
  aperture: [V2, V2, V2, V2];
  /** Outline of the wall that can receive the door's shadow. */
  wallOutline: string;
};

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export const svgPath = (pts: V2[]) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ') + 'Z';

/** Sutherland–Hodgman clip of a 3D polygon against the wall plane z = 0. */
function clipZ(poly: V3[], keepFront: boolean): V3[] {
  const inside = (p: V3) => (keepFront ? p[2] >= 0 : p[2] <= 0);
  const out: V3[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if (inside(a)) out.push(a);
    if (inside(a) !== inside(b)) {
      const t = a[2] / (a[2] - b[2]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0]);
    }
  }
  return out;
}

/** 2D convex hull (monotone chain). */
function hull(pts: V2[]): V2[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const turn = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: V2[] = [];
  const upper: V2[] = [];
  for (const q of p) {
    while (lower.length >= 2 && turn(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  for (const q of p.reverse()) {
    while (upper.length >= 2 && turn(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Key light: in front, slightly towards the latch side and above. */
const LIGHT = unit([0.3, 0.6, 0.75]);
const FRONT_REF = LIGHT[2];

/** Lambert shading, normalised so the closed front face is exactly its base colour. */
function shade(normal: V3, base: RGB) {
  const k = Math.min(1, 0.85 + 0.15 * (Math.max(0, dot(normal, LIGHT)) / FRONT_REF));
  return `rgb(${base.map((c) => Math.round(c * k)).join(',')})`;
}

export function createDoorRig(spec: DoorRigSpec) {
  const [bl, br, tr, tl] = spec.aperture;
  // Least-squares parallelogram fit of the (hand-drawn) opening.
  const ax = (br[0] - bl[0] + (tr[0] - tl[0])) / 2;
  const ay = (bl[1] - br[1] + (tl[1] - tr[1])) / 2;
  const H = (bl[1] - tl[1] + (br[1] - tr[1])) / 2;
  const origin: V2 = [bl[0], (bl[1] + br[1] + ay + tl[1] + H + tr[1] + ay + H) / 4];
  const W = Math.hypot(ax, ay);
  const T = W * 0.052; // door thickness (≈ 45 mm on a 0.9 m door)
  const D = W * 0.14; // wall / jamb depth
  const ux = ax / W;
  const uy = ay / W;

  const project = (p: V3): V2 => [origin[0] + ux * (p[0] + p[2]), origin[1] - uy * p[0] + uy * p[2] - p[1]];
  const VIEW = unit([-ux, 1, ux]); // towards the viewer (null-space of the projection)

  const interior = {
    aperture: svgPath(spec.aperture),
    jamb: svgPath(([[W, 0, 0], [W, H, 0], [W, H, -D], [W, 0, -D]] as V3[]).map(project)),
    jambFill: shade([-1, 0, 0], [214, 78, 6]),
    floor: svgPath(([[0, 0, 0], [W, 0, 0], [W, 0, -D], [0, 0, -D]] as V3[]).map(project)),
    floorFill: shade([0, 1, 0], [236, 92, 10]),
    /** Wall minus the opening (use with clip-rule="evenodd"). */
    wallClip: `${spec.wallOutline} ${svgPath(spec.aperture)}`,
  };

  const faces: { idx: number[]; base: RGB }[] = [
    { idx: [0, 1, 2, 3], base: [255, 255, 255] }, // front – the white door of the logo
    { idx: [5, 4, 7, 6], base: [246, 243, 238] }, // back
    { idx: [1, 5, 6, 2], base: [236, 230, 220] }, // latch edge
    { idx: [4, 0, 3, 7], base: [236, 230, 220] }, // hinge edge
    { idx: [3, 2, 6, 7], base: [240, 235, 227] }, // top
    { idx: [4, 5, 1, 0], base: [220, 213, 202] }, // bottom
  ];
  const slab: V3[] = [
    [0, 0, 0], [W, 0, 0], [W, H, 0], [0, H, 0],
    [0, 0, -T], [W, 0, -T], [W, H, -T], [0, H, -T],
  ];

  /** @param angleDeg 0 = closed, 90 = perpendicular to the wall. */
  function frame(angleDeg: number): DoorFrame {
    if (angleDeg <= 1e-4) {
      return {
        front: [{ d: svgPath(spec.aperture), fill: '#ffffff' }],
        behind: [],
        shadow: '',
        reveal: 0,
        swing: 0,
      };
    }

    const a = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    // The only transform: rigid rotation about the hinge (Y axis through x = 0, z = 0).
    const v = slab.map((p): V3 => [p[0] * cos - p[2] * sin, p[1], p[0] * sin + p[2] * cos]);

    const front: DoorFace[] = [];
    const behind: DoorFace[] = [];
    for (const f of faces) {
      const poly = f.idx.map((i) => v[i]);
      const n = unit(cross(sub(poly[1], poly[0]), sub(poly[2], poly[0])));
      if (dot(n, VIEW) <= 1e-6) continue; // back-face culling; convex slab ⇒ no sorting needed
      const fill = shade(n, f.base);
      const pf = clipZ(poly, true);
      const pb = clipZ(poly, false);
      if (pf.length >= 3) front.push({ d: svgPath(pf.map(project)), fill });
      if (pb.length >= 3) behind.push({ d: svgPath(pb.map(project)), fill });
    }

    const shadow = hull(
      v.map((p) => {
        const z = Math.max(0, p[2]);
        return project([p[0] - (LIGHT[0] * z) / LIGHT[2], p[1] - (LIGHT[1] * z) / LIGHT[2], 0]);
      })
    );

    return {
      front,
      behind,
      shadow: svgPath(shadow),
      reveal: clamp01(angleDeg / 6),
      swing: clamp01(angleDeg >= 90 ? 1 : Math.sin(a)),
    };
  }

  return { interior, frame, project, width: W, height: H };
}

/** Rig for the vector Builder mark (`BrandMark.vue`, `public/brand/builder-logo.svg`). */
export const BUILDER_MARK_DOOR: DoorRigSpec = {
  aperture: [[24, 291], [117, 237], [117, 54], [24, 110]],
  wallOutline: 'M159 0 302 90 246 122 140 61 140 286 260 359 174 408 0 309 0 95Z',
};
