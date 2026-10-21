// 3D vectors and body bases for the front-view rig. The 3D IK solver is in rig/ik.ts.
// World: X lateral (+X is the figure's left, screen right), Y up from the ground, Z toward the viewer.
// gl-matrix does the vector and quaternion math. Vec3 stays a plain [x, y, z] tuple.
import { glMatrix, quat, vec3 } from 'gl-matrix';

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
