// 3D vectors, body bases and two-bone IK for the front-view rig.
// World: X lateral (+X is the figure's left, screen right), Y up from the ground, Z toward the viewer.
// gl-matrix does the vector and quaternion math. Vec3 stays a plain [x, y, z] tuple.
import { clamp } from 'es-toolkit';
import { glMatrix, quat, vec3 } from 'gl-matrix';
import { IK_WARNINGS } from './math.ts';

export type Vec3 = [number, number, number];

const out = (): Vec3 => [0, 0, 0];
export const v3 = (x: number, y: number, z: number): Vec3 => [x, y, z];
export const add3 = (a: Vec3, b: Vec3): Vec3 => vec3.add(out(), a, b) as Vec3;
export const sub3 = (a: Vec3, b: Vec3): Vec3 => vec3.subtract(out(), a, b) as Vec3;
export const mul3 = (a: Vec3, k: number): Vec3 => vec3.scale(out(), a, k) as Vec3;
/** a + b * k. */
export const addScaled3 = (a: Vec3, b: Vec3, k: number): Vec3 => vec3.scaleAndAdd(out(), a, b, k) as Vec3;
export const dot3 = (a: Vec3, b: Vec3): number => vec3.dot(a, b);
export const cross3 = (a: Vec3, b: Vec3): Vec3 => vec3.cross(out(), a, b) as Vec3;
export const len3 = (a: Vec3): number => vec3.length(a);
export const norm3 = (a: Vec3): Vec3 => vec3.normalize(out(), a) as Vec3;
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => vec3.lerp(out(), a, b, t) as Vec3;
/** Sum of several vectors. */
export const sum3 = (...vs: Vec3[]): Vec3 => vs.reduce((s, v) => add3(s, v), out());

/** Rotate v around the unit axis k by deg degrees (right-hand rule). */
export function rotAxis(v: Vec3, k: Vec3, deg: number): Vec3 {
  const q = quat.setAxisAngle(quat.create(), k, glMatrix.toRadian(deg));
  return vec3.transformQuat(out(), v, q) as Vec3;
}

/** Orthonormal body basis: L lateral (toward the figure's left), U up, F forward (where the figure faces). */
export interface Basis {
  L: Vec3;
  U: Vec3;
  F: Vec3;
}

export const IDENTITY: Basis = { L: [1, 0, 0], U: [0, 1, 0], F: [0, 0, 1] };

/** Rotate every axis of a basis around the unit axis k. */
export const rotBasis = (b: Basis, k: Vec3, deg: number): Basis => ({ L: rotAxis(b.L, k, deg), U: rotAxis(b.U, k, deg), F: rotAxis(b.F, k, deg) });

/**
 * Turn a basis by body-relative angles in degrees, applied in this order:
 * yaw around U (positive turns the face toward the figure's left),
 * pitch around L (positive tips U toward F, a forward bend),
 * roll around F (positive tips U toward L, a side bend to the figure's left).
 */
export function turn(b: Basis, { yaw = 0, pitch = 0, roll = 0 }: { yaw?: number; pitch?: number; roll?: number }): Basis {
  let r = b;
  // Right-hand rule: +deg around U carries F toward L; +deg around L carries U toward F; -deg around F carries U toward L.
  if (yaw) r = rotBasis(r, r.U, yaw);
  if (pitch) r = rotBasis(r, r.L, pitch);
  if (roll) r = rotBasis(r, r.F, -roll);
  return r;
}

/** Point in a basis: x along L, y along U, z along F. */
export const inBasis = (o: Vec3, b: Basis, [x, y, z]: Vec3): Vec3 => addScaled3(addScaled3(addScaled3(o, b.L, x), b.U, y), b.F, z);

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
