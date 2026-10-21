// Two-bone inverse kinematics for the side rig (2D) and the front rig (3D).
// Both solvers clamp unreachable targets and record a warning in IK_WARNINGS.
import { clamp } from 'es-toolkit';
import { ang, D2R, dir, dot, len, polar, sub, type Vec2 } from '@/math/vec2.ts';
import { addScaled3, cross3, dot3, len3, norm3, sub3, type Vec3 } from '@/math/vec3.ts';

/** Unreachable IK targets found since the last reset. `compose` clears and reads this list per animation. */
export const IK_WARNINGS: string[] = [];

/** Pick the bend sign so the middle joint lies on the side of `side`. */
export function bendFor(A: Vec2, T: Vec2, side: Vec2): 1 | -1 {
  const perp = dir(ang(sub(T, A)) + 90);
  return dot(side, perp) >= 0 ? 1 : -1;
}

export interface IKResult {
  /** Direction of the first bone, in degrees. */
  a1: number;
  /** Direction of the second bone, in degrees. */
  a2: number;
  /** Middle joint. */
  J: Vec2;
}

/**
 * Two-bone IK from root A toward target T: the law of cosines gives the angle at the root.
 * Clamps unreachable targets and records a warning.
 */
export function ik2(A: Vec2, T: Vec2, l1: number, l2: number, bend: number, tag = ''): IKResult {
  const d = sub(T, A);
  let reach = len(d);
  const maxd = l1 + l2 - 1e-4;
  const mind = Math.abs(l1 - l2) + 1e-4;
  if (reach > maxd + 0.5 || reach < mind - 0.5) IK_WARNINGS.push(`${tag} unreachable: dist=${reach.toFixed(1)} range=[${mind.toFixed(1)}, ${maxd.toFixed(1)}]`);
  reach = clamp(reach, mind, maxd);
  const base = ang(d);
  const cosA = (l1 * l1 + reach * reach - l2 * l2) / (2 * l1 * reach);
  const a = Math.acos(clamp(cosA, -1, 1)) / D2R;
  const a1 = base + bend * a;
  const J = polar(A, a1, l1);
  const a2 = ang(sub(polar(A, base, reach), J));
  return { a1, a2, J };
}

export interface IK3Result {
  mid: Vec3;
  end: Vec3;
}

/**
 * Two-bone IK from root A toward target T: the law of cosines gives the angle at the root, and the middle joint
 * bends toward `pole`, a direction. Clamps unreachable targets and records a warning in IK_WARNINGS.
 */
export function ik3(A: Vec3, T: Vec3, l1: number, l2: number, pole: Vec3, tag = ''): IK3Result {
  const d = sub3(T, A);
  let reach = len3(d);
  const maxd = l1 + l2 - 1e-4, mind = Math.abs(l1 - l2) + 1e-4;
  if (reach > maxd + 0.5 || reach < mind - 0.5) IK_WARNINGS.push(`${tag} unreachable: dist=${reach.toFixed(1)} range=[${mind.toFixed(1)}, ${maxd.toFixed(1)}]`);
  reach = clamp(reach, mind, maxd);
  const u = norm3(d);
  // Component of the pole perpendicular to the limb.
  let q = addScaled3(pole, u, -dot3(pole, u));
  if (len3(q) < 1e-6) {
    // Pole parallel to the limb: bend toward any perpendicular direction.
    q = Math.abs(u[1]) < 0.9 ? cross3(u, [0, 1, 0]) : cross3(u, [1, 0, 0]);
  }
  q = norm3(q);
  const cosA = clamp((l1 * l1 + reach * reach - l2 * l2) / (2 * l1 * reach), -1, 1);
  const sinA = Math.sqrt(1 - cosA * cosA);
  const mid = addScaled3(addScaled3(A, u, l1 * cosA), q, l1 * sinA);
  const end = addScaled3(A, u, reach);
  return { mid, end };
}
