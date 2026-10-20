// Moves equipment shapes drawn in local coordinates to a screen position, for static props.
import { add, D2R, len, rotate, type Vec2 } from '@/math.ts';
import type { PropShape } from '@/exercise.ts';


/** Shapes rotated by `rot` degrees (clockwise on screen) about the local origin, then moved to `at`. */
export function place(shapes: PropShape[], at: Vec2, rot = 0): PropShape[] {
  return shapes.map((p): PropShape => {
    if (p.kind === 'poly') return { ...p, pts: p.pts.map((q) => add(rotate(q, rot), at)) };
    return { ...p, c: add(rotate(p.c, rot), at), rot: (p.rot ?? 0) + rot };
  });
}

/** Screen x range of a list of static shapes, for Exercise.propsBox. */
export function shapesBox(shapes: PropShape[]): [number, number] {
  let x0 = Infinity, x1 = -Infinity;
  for (const p of shapes) {
    if (p.kind === 'poly') {
      for (const q of p.pts) { x0 = Math.min(x0, q[0] - (p.w ?? 0)); x1 = Math.max(x1, q[0] + (p.w ?? 0)); }
      continue;
    }
    // Rotated shapes: use the half diagonal, which always covers them.
    const r = p.rot ? len(p.s) / 2 : p.s[0] / 2;
    x0 = Math.min(x0, p.c[0] - r); x1 = Math.max(x1, p.c[0] + r);
  }
  return [x0, x1];
}
