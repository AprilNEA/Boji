// Shared front-view bases for core-rotation-2. The builders keep feet or the seated base stable.
// Each implement follows a hand grip. Torso yaw and the handle path make the rotation visible.
import type { FrontExercise, Props } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { smooth } from '@/math/timeline.ts';
import { lerp3, type Vec3 } from '@/math/vec3.ts';
import { FB, project, toeDir, type FrontPose } from '@/rig/front.ts';
import { BODY, GROUND } from '@/rig/side.ts';
import { cableColumn, cableHandle, cableLine, frontGripAt, towardCable, workTL } from '@/exercises/equipment/index.ts';

export const FLOOR_Y = BODY.ankleH;

type FrontBase = Omit<FrontPose, 'arms'>;

/** Standing with planted, soft knees. Wider stances lower the hips so both feet stay reachable. */
export function standing(width = 36, pelvisY = BODY.ankleH + 182, yaw = 0, pitch = 0): FrontBase {
  return {
    pelvis: [0, pelvisY, 0],
    hips: { pitch },
    spine: { yaw },
    head: { yaw: yaw * 0.35 },
    legs: {
      l: { target: [width, FLOOR_Y, 3], dir: toeDir([0, 0, 1]) },
      r: { target: [-width, FLOOR_Y, 3], dir: toeDir([0, 0, 1]) },
    },
  };
}

/** Stable seated base: hips on the seat or floor, bent knees, and both soles on the ground. */
export function seated(yaw = 0, elevatedFeet = false, feetTogether = false): FrontBase {
  const ankleY = elevatedFeet ? 76 : FLOOR_Y;
  const ankleX = feetTogether ? 9 : 42;
  return {
    pelvis: [0, 112, 0],
    spine: { pitch: -12, yaw },
    head: { yaw: yaw * 0.35, pitch: -4 },
    legs: {
      l: { target: [ankleX, ankleY, 108], dir: toeDir([0, 0, 1], elevatedFeet ? 0 : undefined) },
      r: { target: [-ankleX, ankleY, 108], dir: toeDir([0, 0, 1], elevatedFeet ? 0 : undefined) },
    },
  };
}

/** Two hands close together around one handle or held object. */
export function pairedHands(p: Vec3): FrontPose['arms'] {
  return {
    l: { target: [p[0] + 4, p[1], p[2]], pole: [42, -12, 36] },
    r: { target: [p[0] - 4, p[1], p[2]], pole: [-42, -12, 36] },
  };
}

export type CableConfig = {
  id: string;
  name: string;
  en: string;
  sources: string[];
  start: Vec3;
  end: Vec3;
  columnX: number;
  pulleyY: number;
  handle?: 'd' | 'rope';
  muscles: NonNullable<FrontExercise['muscles']>;
  body?: (p: number) => FrontBase;
  extraProps?: (pal: Parameters<NonNullable<FrontExercise['props']>>[0]) => Props;
  poster?: number;
};

/** A cable column, cable and attachment connected to a two-handed grip. */
export function cableRotation(config: CableConfig): FrontExercise {
  const tl = workTL(0.35);
  const column = cableColumn({ x: config.columnX, pulleyY: config.pulleyY, toward: config.columnX < 0 ? 1 : -1 });
  const grip = (J: Parameters<typeof frontGripAt>[0]) => frontGripAt(J, 'l');
  return {
    id: config.id,
    name: config.name,
    view: 'front',
    tl,
    poster: config.poster,
    meta: { en: config.en, family: 'core-rotation', equipment: ['cable'], sources: config.sources },
    muscles: config.muscles,
    props: (pal) => {
      const extra = config.extraProps?.(pal);
      return { back: [...column.draw(pal), ...(extra?.back ?? [])], front: extra?.front };
    },
    propsBox: [Math.min(column.box[0], -95), Math.max(column.box[1], 95)],
    dynamic: [
      cableLine(column.pulley, (J) => grip(J)),
      cableHandle(config.handle ?? 'd', (J) => {
        const p = grip(J);
        return { p, a: towardCable(p, column.pulley) };
      }),
    ],
    pose(t) {
      const p = smooth(tl.at(t).p);
      const hand = lerp3(config.start, config.end, p);
      return { ...(config.body?.(p) ?? standing()), arms: pairedHands(hand) };
    },
  };
}

/** Screen point for a hand-held object centred between the two grips. */
export function meanGrip(J: Parameters<typeof frontGripAt>[0]): [number, number] {
  const a = frontGripAt(J, 'l'), b = frontGripAt(J, 'r');
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/** A floor-level machine pad used by the kneeling torsion station. */
export function kneelingStationProps(pal: Parameters<NonNullable<FrontExercise['props']>>[0]): Props {
  return {
    back: [
      { kind: 'box' as const, nm: 'machine-base', color: pal.metalDark, c: [0, GROUND - 5], s: [228, 10], r: 4 },
      { kind: 'box' as const, nm: 'machine-upright', color: pal.prop, c: [0, 270], s: [18, 230], r: 5 },
      { kind: 'box' as const, nm: 'machine-crossbar', color: pal.metal, c: [0, 222], s: [164, 12], r: 5 },
      { kind: 'box' as const, nm: 'knee-pad-left', color: pal.pad, c: [38, GROUND - 18], s: [54, 22], r: 10 },
      { kind: 'box' as const, nm: 'knee-pad-right', color: pal.pad, c: [-38, GROUND - 18], s: [54, 22], r: 10 },
      { kind: 'box' as const, nm: 'handle-left', color: pal.metalDark, c: [54, 238], s: [46, 8], r: 4 },
      { kind: 'box' as const, nm: 'handle-right', color: pal.metalDark, c: [-54, 238], s: [46, 8], r: 4 },
    ],
  };
}

/** A kneeling base with ankles folded behind the knees and knees resting on the pads. */
export function kneeling(yaw = 0): FrontBase {
  return {
    pelvis: [0, 128, 0],
    spine: { yaw },
    head: { yaw: yaw * 0.35 },
    legs: {
      l: { target: [22, 20, -108], pole: [28, -55, 44], dir: [0, 0, -1] },
      r: { target: [-22, 20, -108], pole: [-28, -55, 44], dir: [0, 0, -1] },
    },
  };
}

/** A simple padded cable-station seat that supports the seated twist pelvis. */
export function cableSeatProps(pal: Parameters<NonNullable<FrontExercise['props']>>[0]): Props {
  return {
    back: [
      { kind: 'box', nm: 'cable-seat-post', color: pal.metalDark, c: [0, 397], s: [12, 104], r: 3 },
      { kind: 'box', nm: 'cable-seat-base', color: pal.metalDark, c: [0, GROUND - 5], s: [116, 10], r: 3 },
      { kind: 'box', nm: 'cable-seat', color: pal.pad, c: [0, 347], s: [122, 18], r: 8 },
    ],
  };
}

/** Project a fixed world point to the dynamic screen coordinate contract. */
export const screen = project;
export const bodyWidth = FB.shoulderHalf;
export const coreTL = workTL;
export const phase = (t: number, tl: ReturnType<typeof workTL>) => smooth(tl.at(t).p);
export const lerpN = lerp;
