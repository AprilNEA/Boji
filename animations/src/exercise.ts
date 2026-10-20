// Contract for exercise scripts in src/exercises: pose over time, highlighted muscles,
// static props and moving equipment. compose.ts turns an Exercise into a Lottie animation.
import type { Phase, Vec2 } from './math.ts';
import type { Palette } from './palettes.ts';
import type { Joints, MuscleKey, Pose } from './rig.ts';

/** Equipment shape. World coordinates for static props, layer coordinates for rigid parts. */
export interface PropShape {
  kind: 'box' | 'oval';
  nm: string;
  color: string;
  c: Vec2;
  s: Vec2;
  /** Corner radius, boxes only. */
  r?: number;
  rot?: number;
}

/** Static props drawn behind and in front of the figure. */
export interface Props {
  back?: PropShape[];
  front?: PropShape[];
}

interface MovingBase {
  nm: string;
  /**
   * Draw order. 'back': behind the whole figure. 'front': in front of it.
   * 'underNearArm': in front of the head, torso and near leg, behind the near arm.
   * 'overFarArm': in front of the far arm, behind the torso.
   */
  z: 'back' | 'front' | 'underNearArm' | 'overFarArm';
}

/** Equipment that moves as one piece, such as a weight stack or a handle. */
export interface RigidPart extends MovingBase {
  kind: 'rigid';
  shapes: (pal: Palette) => PropShape[];
  at: (J: Joints, t: number) => { p: Vec2; a?: number };
}

/** Straight cable between two moving points. */
export interface Cable extends MovingBase {
  kind: 'line';
  width?: number;
  color: (pal: Palette) => string;
  at: (J: Joints, t: number) => [Vec2, Vec2];
}

export type MovingPart = RigidPart | Cable;

export interface MuscleSpec {
  m: MuscleKey;
  /** Which limb gets the highlight. Default: both. Ignored for torso muscles. */
  side?: 'near' | 'far' | 'both';
  /** Multiplies effort. Default 1. */
  scale?: number;
  /** Effort 0 to 1 at loop time t. Default: effort of the timeline phase. */
  e?: (t: number) => number;
}

export interface Exercise {
  /** Matches Exercise.id in the apps. */
  id: string;
  name: string;
  /** `at` may be omitted when every muscle defines its own `e`. */
  tl: { total: number; at?: (t: number) => Phase };
  muscles?: MuscleSpec[];
  /** Draw an exercise mat under the figure. */
  mat?: boolean;
  props?: (pal: Palette) => Props;
  /** Horizontal extent of the props, included when centering the animation. */
  propsBox?: [number, number];
  dynamic?: MovingPart[];
  /**
   * Loop time in [0, 1) of the poster frame, the still image shown when animations are off.
   * Default: the middle of the first span with the highest total muscle effort.
   */
  poster?: number;
  /** Rig pose at loop time t in [0, 1). */
  pose(t: number): Pose;
}
