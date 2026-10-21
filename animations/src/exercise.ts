// Contract for exercise scripts: pose over time, highlighted muscles, static props and moving equipment.
// Side-view scripts (the default) use the 2D rig in rig/side.ts; compose/side.ts turns them into Lottie.
// Front-view scripts (`view: 'front'`) use the 3D rig in rig/front.ts; compose/front.ts turns them into Lottie.
import type { Phase } from '@/math/timeline.ts';
import type { Vec2 } from '@/math/vec2.ts';
import type { Palette } from '@/draw/palettes.ts';
import type { Joints, MuscleKey, MuscleRegion, Pose } from '@/rig/side.ts';
import type { FrontJoints, FrontLayerKey, FrontPose, FrontRegion } from '@/rig/front.ts';

/** Equipment shape. Screen coordinates for static props, layer coordinates for moving parts. */
export type PropShape =
  /** Filled rectangle with optional corner radius r, rotated by rot degrees about its center c. */
  | { kind: 'box'; nm: string; color: string; c: Vec2; s: Vec2; r?: number; rot?: number }
  /** Filled ellipse of size s. */
  | { kind: 'oval'; nm: string; color: string; c: Vec2; s: Vec2; rot?: number }
  /** Ellipse outline of size s and stroke width w, such as a kettlebell handle. */
  | { kind: 'ring'; nm: string; color: string; c: Vec2; s: Vec2; w: number; rot?: number }
  /**
   * Polygon or polyline through pts. Filled when w is not given, otherwise stroked with width w.
   * smooth: Catmull-Rom curve through the points. closed: default true for fills, false for strokes.
   */
  | { kind: 'poly'; nm: string; color: string; pts: Vec2[]; w?: number; smooth?: boolean; closed?: boolean };

/** Static props drawn behind and in front of the figure. */
export interface Props {
  back?: PropShape[];
  front?: PropShape[];
}

interface MovingBase {
  nm: string;
  /**
   * Draw order.
   * 'back': behind the whole figure. 'front': in front of it.
   * Side view: 'underNearArm' is in front of the head, torso and near leg, behind the near arm.
   * 'overFarArm' is in front of the far arm, behind the torso.
   * Front view: 'underNearArm' and 'overFarArm' both mean in front of the torso and head, behind both arms.
   */
  z: 'back' | 'front' | 'underNearArm' | 'overFarArm';
}

/** Equipment that moves as one piece, such as a weight stack or a handle. */
export interface RigidPart<J = Joints> extends MovingBase {
  kind: 'rigid';
  shapes: (pal: Palette) => PropShape[];
  /** Screen position and rotation in degrees at loop time t. */
  at: (J: J, t: number) => { p: Vec2; a?: number };
}

/** Straight cable between two moving points, in screen coordinates. */
export interface Cable<J = Joints> extends MovingBase {
  kind: 'line';
  width?: number;
  color: (pal: Palette) => string;
  at: (J: J, t: number) => [Vec2, Vec2];
}

/** Smooth open curve through moving points, such as a resistance band or a battle rope. Keep the point count fixed. */
export interface Curve<J = Joints> extends MovingBase {
  kind: 'curve';
  width?: number;
  color: (pal: Palette) => string;
  at: (J: J, t: number) => Vec2[];
}

export type MovingPart<J = Joints> = RigidPart<J> | Cable<J> | Curve<J>;

export interface MuscleSpec {
  m: MuscleKey;
  /**
   * Which limb gets the highlight. Ignored for torso muscles.
   * Side view: 'near', 'far' or 'both'. Front view: 'l' (figure's left, screen right), 'r' or 'both'.
   * Default: the region's default side, else both.
   */
  side?: 'near' | 'far' | 'l' | 'r' | 'both';
  /** Multiplies effort. Default 1. */
  scale?: number;
  /** Effort 0 to 1 at loop time t. Default: effort of the timeline phase. */
  e?: (t: number) => number;
  /**
   * Custom highlight position: a side-view MuscleRegion or a front-view FrontRegion.
   * Needed in front view for muscles that face away from the viewer, such as glutes and triceps.
   */
  region?: MuscleRegion | FrontRegion;
}

/** Fields shared by both views. */
interface ExerciseBase {
  /** Lowercase kebab-case. Matches Exercise.id in the apps for course exercises. */
  id: string;
  /** Display name in Chinese. */
  name: string;
  /** `at` may be omitted when every muscle defines its own `e`. */
  tl: { total: number; at?: (t: number) => Phase };
  muscles?: MuscleSpec[];
  /** Draw an exercise mat under the figure. */
  mat?: boolean;
  props?: (pal: Palette) => Props;
  /** Horizontal extent of the props, included when centering the animation. */
  propsBox?: [number, number];
  /**
   * Loop time in [0, 1) of the poster frame, the still image shown when animations are off.
   * Default: the middle of the first span with the highest total muscle effort.
   */
  poster?: number;
  /** Catalog data. Required for library exercises (src/exercises/library), absent for course exercises. */
  meta?: LibraryMeta;
}

/** Side view: the figure faces screen right. Default view. */
export interface SideExercise extends ExerciseBase {
  view?: 'side';
  dynamic?: MovingPart<Joints>[];
  /** Rig pose at loop time t in [0, 1). */
  pose(t: number): Pose;
}

/** Front view: the figure faces the viewer. Use it when the movement happens in the frontal plane. */
export interface FrontExercise extends ExerciseBase {
  view: 'front';
  dynamic?: MovingPart<FrontJoints>[];
  /** Rig pose at loop time t in [0, 1). */
  pose(t: number): FrontPose;
  /** Full draw order, back to front. Default: FRONT_ORDER in rig/front.ts. Must list every key once. */
  order?: FrontLayerKey[];
}

export type Exercise = SideExercise | FrontExercise;

/**
 * Equipment tags of the catalog. The first 24 match the stage-0 classification (snake_case there).
 * 'bench' covers bench_only. The last six are helpers that scripts may also list.
 */
export type EquipmentTag =
  | 'bodyweight' | 'dumbbell' | 'barbell' | 'cable' | 'machine' | 'other' | 'band' | 'smith' | 'kettlebell'
  | 'pull-up-bar' | 'stability-ball' | 'ez-bar' | 'bench' | 'medicine-ball' | 'foam-roller' | 'box'
  | 'cardio-machine' | 'dip-station' | 'sled' | 'rope' | 'landmine' | 'bosu' | 'sandbag' | 'trap-bar'
  | 'mat' | 'wall' | 'chair' | 'plate' | 'step' | 'suspension';

export interface LibraryMeta {
  /** English name, as in the source datasets after normalization. */
  en: string;
  /** Movement family, the directory name under src/exercises/library. */
  family: string;
  equipment: EquipmentTag[];
  /** Source records that this animation covers: `fe:<id>` (free-exercise-db) or `hz:<id>` (hasaneyldrm). */
  sources: string[];
}
