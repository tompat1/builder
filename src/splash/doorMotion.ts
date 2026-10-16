/**
 * Door opening curve for the loading screen (milliseconds → degrees).
 * Same character as the brand video, compressed for a loading screen:
 * the latch pops a few degrees, rests a beat, then the heavy door is pushed
 * (ease-in) and glides to rest against friction.
 */
export const LATCH_START_MS = 180;
export const LATCH_END_MS = 420;
export const SWING_START_MS = 620;
export const SWING_END_MS = 2300;
export const LATCH_ANGLE = 3.5;
export const OPEN_ANGLE = 112;

/** CSS-style cubic-bezier easing (x1, y1, x2, y2), solved with Newton + bisection. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t ** 2 * (1 - t) + t ** 3;
  const by = (t: number) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t ** 2 * (1 - t) + t ** 3;
  const dx = (t: number) => 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t ** 2;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (bx(t) - x) / d;
    }
    if (t < 0 || t > 1 || Math.abs(bx(t) - x) > 1e-4) {
      let lo = 0;
      let hi = 1;
      t = x;
      for (let i = 0; i < 30; i++) {
        if (bx(t) < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
    }
    return by(t);
  };
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const swingEase = cubicBezier(0.5, 0, 0.18, 1);
const progress = (ms: number, from: number, to: number) => Math.min(1, Math.max(0, (ms - from) / (to - from)));

export function doorAngleAt(ms: number): number {
  if (ms < SWING_START_MS) return LATCH_ANGLE * easeOutCubic(progress(ms, LATCH_START_MS, LATCH_END_MS));
  return LATCH_ANGLE + (OPEN_ANGLE - LATCH_ANGLE) * swingEase(progress(ms, SWING_START_MS, SWING_END_MS));
}
