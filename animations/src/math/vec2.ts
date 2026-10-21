// 2D vectors, angles and scalar interpolation.
// Screen coordinates: x right, y down. Angles in degrees, clockwise from +x.
//
// gl-matrix does the vector math, d3-interpolate interpolates numbers and es-toolkit clamps. Vec2 stays a plain
// [x, y] tuple, so exercise files can write points as literals. The functions below only adapt the library calls
// to degrees and tuples. Easing and timelines are in timeline.ts; two-bone IK is in rig/ik.ts.
import { interpolateNumber } from 'd3-interpolate';
import { clamp } from 'es-toolkit';
import { glMatrix, vec2 } from 'gl-matrix';

export type Vec2 = [number, number];

export { clamp };

const out = (): Vec2 => [0, 0];
const ORIGIN: Vec2 = [0, 0];
/** Degrees to radians. */
export const D2R = glMatrix.toRadian(1);

export const add = (a: Vec2, b: Vec2): Vec2 => vec2.add(out(), a, b) as Vec2;
export const sub = (a: Vec2, b: Vec2): Vec2 => vec2.subtract(out(), a, b) as Vec2;
export const mul = (a: Vec2, k: number): Vec2 => vec2.scale(out(), a, k) as Vec2;
/** a + b * k. */
export const addScaled = (a: Vec2, b: Vec2, k: number): Vec2 => vec2.scaleAndAdd(out(), a, b, k) as Vec2;
export const dot = (a: Vec2, b: Vec2): number => vec2.dot(a, b);
export const len = (a: Vec2): number => vec2.length(a);
export const dist = (a: Vec2, b: Vec2): number => vec2.distance(a, b);
export const norm = (a: Vec2): Vec2 => vec2.normalize(out(), a) as Vec2;
/** Rotate v by deg degrees around the origin. Positive turns clockwise on screen. */
export const rotate = (v: Vec2, deg: number): Vec2 => vec2.rotate(out(), v, ORIGIN, glMatrix.toRadian(deg)) as Vec2;
/** Unit vector that points in direction deg. */
export const dir = (deg: number): Vec2 => rotate([1, 0], deg);
/** Point at distance r from p in direction deg. */
export const polar = (p: Vec2, deg: number, r: number): Vec2 => addScaled(p, dir(deg), r);
/** v with x multiplied by f: f = -1 mirrors a direction for equipment that faces left. */
export const mirrorX = (v: Vec2, f: number): Vec2 => vec2.multiply(out(), v, [f, 1]) as Vec2;
/** Direction of v in degrees, in (-180, 180]. */
export const ang = (v: Vec2): number => Math.atan2(v[1], v[0]) / D2R;
/** Angle between two vectors in degrees, in [0, 180]. */
export const angleBetween = (a: Vec2, b: Vec2): number => vec2.angle(a, b) / D2R;
export const lerp = (a: number, b: number, t: number): number => interpolateNumber(a, b)(t);
export const lerpV = (a: Vec2, b: Vec2, t: number): Vec2 => vec2.lerp(out(), a, b, t) as Vec2;
