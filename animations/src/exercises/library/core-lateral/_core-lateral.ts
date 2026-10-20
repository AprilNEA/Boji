// Private pose builders for the core-lateral work list.
// Front builders keep both feet planted and move the torso by lateral spinal flexion.
// Side builders use the existing floor contacts for supine and plank-based movements.
import type { FrontExercise, PropShape, SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, timeline, type Vec2 } from '@/math.ts';
import { add3 } from '@/math3.ts';
import { project, toeDir, type FrontPose } from '@/front-rig.ts';
import { BODY, solve, type Pose } from '@/rig.ts';
import { A, FLOOR, G } from '@/exercises/common.ts';
import {
  BALL, barbell, cableColumn, cableHandle, cableLine, frontDumbbell, frontGripAt,
  stabilityBall, towardCable, workTL,
} from '@/exercises/equipment/index.ts';

type StandingKind = 'bodyweight' | 'dumbbell' | 'barbell' | 'cable-low' | 'cable-high';
type Common = { id: string; name: string; en: string; equipment: NonNullable<FrontExercise['meta']>['equipment']; sources: string[] };
type CableMode = 'side-bend' | 'crunch';

const BOSU_RISE = 28;
const bosuProps = (pal: { prop: string; propLight: string; propDark: string }): PropShape[] => [
  { kind: 'oval', nm: 'bosu-dome', color: pal.propLight, c: [0, G - 17], s: [118, 38] },
  { kind: 'box', nm: 'bosu-base', color: pal.propDark, c: [0, G - 4], s: [122, 9], r: 4 },
  { kind: 'box', nm: 'bosu-rim', color: pal.prop, c: [0, G - 9], s: [112, 5], r: 2.5 },
];

/** A standing lateral flexion with floor or BOSU foot targets and a visible fixed-point load. */
export function standingSideBend(spec: Common & {
  kind: StandingKind; alternating?: boolean; deep?: boolean; bosu?: boolean; cableMode?: CableMode;
}): FrontExercise {
  const tl = spec.alternating
    ? timeline([{ d: 0.8, from: 0, to: 1, e: [0.3, 1] }, { d: 0.35, from: 1, to: 1, e: [1, 0.9] }, { d: 1.0, from: 1, to: -1, e: [0.8, 1] }, { d: 0.35, from: -1, to: -1, e: [0.9, 0.8] }, { d: 0.8, from: -1, to: 0, e: [0.8, 0.3] }])
    : workTL(0.35);
  const cable = spec.kind.startsWith('cable');
  const column = cable ? cableColumn({ x: -154, pulleyY: spec.kind === 'cable-high' ? 82 : G - 64, toward: 1 }) : undefined;
  const footY = BODY.ankleH + (spec.bosu ? BOSU_RISE : 0);
  const pose = (t: number): FrontPose => {
    const q = tl.at!(t).p;
    const roll = spec.alternating ? q * (spec.deep ? 66 : 58) : -q * (spec.deep ? 46 : 29);
    const lowHand = (J: any, side: 'l' | 'r', extra = 0) => add3(J[`shoulder_${side}`], [0, -120 - extra, 9]);
    const hipHand = (J: any, side: 'l' | 'r') => add3(J.B(0.18), [side === 'l' ? 25 : -25, -6, 24]);
    const cableHand = (J: any) => {
      if (spec.kind === 'cable-high') return add3(J.shoulder_r, [-52, -44, 22]);
      if (spec.cableMode === 'crunch') return add3(J.B(0.22), [-45, -8, 25]);
      return lowHand(J, 'r');
    };
    const barHandL = (J: any) => add3(J.shoulder_l, [70, 0, -7]);
    const barHandR = (J: any) => add3(J.shoulder_r, [-70, 0, -7]);
    return {
      pelvis: [0, footY + 183.6, 0],
      spine: { roll }, head: { roll: -roll * 0.12 },
      legs: { l: { target: [19, footY, 2] }, r: { target: [-19, footY, 2] } },
      arms: spec.kind === 'barbell'
        ? { l: { target: barHandL }, r: { target: barHandR } }
        : cable
          ? { l: { target: (J) => hipHand(J, 'l') }, r: { target: cableHand } }
          : spec.kind === 'dumbbell'
            ? { l: { target: (J) => lowHand(J, 'l') }, r: { target: (J) => hipHand(J, 'r') } }
            : { l: { target: (J) => lowHand(J, 'l', spec.deep ? 3 : 0) }, r: { target: (J) => lowHand(J, 'r', spec.deep ? 3 : 0) } },
    };
  };
  const dynamic: FrontExercise['dynamic'] = [];
  if (spec.kind === 'dumbbell') dynamic.push(frontDumbbell('l', 'end'));
  if (spec.kind === 'barbell') {
    dynamic.push(barbell({ view: 'front', plate: 'medium', at: (J) => {
      const l = frontGripAt(J, 'l'), r = frontGripAt(J, 'r');
      return { p: [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2], a: Math.atan2(r[1] - l[1], r[0] - l[0]) * 180 / Math.PI };
    } }));
  }
  if (column) {
    const grip = (J: any) => frontGripAt(J, 'r');
    dynamic.push(cableLine(column.pulley, grip));
    dynamic.push(cableHandle('d', (J: any) => {
      const p = grip(J);
      return { p, a: towardCable(p, column.pulley) };
    }));
  }
  return {
    id: spec.id, name: spec.name, view: 'front', tl, meta: { en: spec.en, family: 'core-lateral', equipment: spec.equipment, sources: spec.sources },
    muscles: [{ m: 'obliques' }, { m: 'abs', scale: 0.55 }],
    props: column || spec.bosu ? (pal) => ({ back: [...(column?.draw(pal) ?? []), ...(spec.bosu ? bosuProps(pal) : [])] }) : undefined,
    propsBox: column ? [column.box[0], 138] : spec.bosu ? [-61, 61] : undefined,
    dynamic, pose,
  };
}

/** Supine crunch with feet held flat. The upper back curls while the pelvis and feet remain on the mat. */
export function supineObliqueCrunch(spec: { id: string; name: string; en: string; sources: string[]; heelTouch?: boolean; elevatedFeet?: boolean }): SideExercise {
  const tl = timeline([
    { d: 0.85, from: 0, to: 1, e: [0.25, 1] }, { d: 0.3, from: 1, to: 1, e: [1, 0.9] },
    { d: 0.85, from: 1, to: -1, e: [0.85, 1] }, { d: 0.3, from: -1, to: -1, e: [1, 0.9] },
    { d: 1.1, from: -1, to: 0, e: [0.8, 0.25] },
  ]);
  const neck: Vec2 = [145, FLOOR - 18];
  const hip = add(neck, mul(dir(-4), 123.5));
  const flat = -4;
  const ankle: Vec2 = spec.elevatedFeet ? [hip[0] + 105, FLOOR - A - 72] : [hip[0] + 105, FLOOR - A];
  const pose = (t: number): Pose => {
    const p = tl.at(t).p, a = Math.abs(p);
    const armNear = spec.heelTouch
      ? { a1: lerp(6, -17 * p, a), a2: lerp(1, -20 * p, a), hand: lerp(0, -20 * p, a) }
      : { a1: lerp(178, 218, a), a2: lerp(178, 224, a), hand: lerp(180, 224, a) };
    return {
      hip, spine: { lumbar: flat - 1, thoracic: flat + 30 * a }, neck: lerp(182, 220, a), head: lerp(181, 224, a),
      legs: {
        near: { target: ankle, foot: spec.elevatedFeet ? 12 : 0, side: [0, -1] },
        far: { target: add(ankle, [-5, 0]), foot: spec.elevatedFeet ? 12 : 0, side: [0, -1] },
      },
      arms: { near: armNear, far: { ...armNear, a1: (armNear.a1 ?? 0) + 2, a2: (armNear.a2 ?? 0) + 1 } },
    };
  };
  return {
    id: spec.id, name: spec.name, tl, mat: true, meta: { en: spec.en, family: 'core-lateral', equipment: ['bodyweight'], sources: spec.sources },
    muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.8 }], pose,
  };
}

/** A front-rig side plank, turned 90° so the viewer sees the long side of the body. */
export function sidePlank(spec: { id: string; name: string; en: string; sources: string[]; incline?: boolean; dumbbell?: boolean }): FrontExercise {
  const tl = workTL(0.5);
  const pose = (t: number): FrontPose => {
    const p = tl.at(t).p;
    const armP = spec.dumbbell ? p : 1;
    // Positive roll puts the body length across the screen. The support elbow remains below its shoulder on the mat.
    const support = (J: any) => [J.shoulder_l[0] - 60, 8, J.shoulder_l[2]] as [number, number, number];
    // The top arm stays above the floor, then sweeps to the ceiling at a nearly straight reach.
    const top = (J: any) => {
      const a = lerp(-Math.PI / 2, Math.PI / 2, armP);
      return [J.shoulder_r[0] + Math.cos(a) * 118, J.shoulder_r[1] + Math.sin(a) * 118, J.shoulder_r[2]] as [number, number, number];
    };
    return {
      pelvis: [0, 112, 0], hips: { roll: 90 }, spine: { roll: 2 }, neck: { roll: -2 }, head: { roll: -2 },
      legs: {
        l: { target: [-164, BODY.ankleH, 0], dir: toeDir([-1, 0, 0]) },
        r: { target: [-142, BODY.ankleH, -3], dir: toeDir([-1, 0, 0]) },
      },
      arms: { l: { target: support, pole: [1, 0, 0] }, r: { target: top } },
    };
  };
  return {
    id: spec.id, name: spec.name, view: 'front', tl, mat: true, meta: { en: spec.en, family: 'core-lateral', equipment: spec.dumbbell ? ['bodyweight', 'dumbbell'] : ['bodyweight'], sources: spec.sources },
    muscles: spec.dumbbell ? [{ m: 'delts', side: 'r', scale: 0.9 }, { m: 'obliques', scale: 0.6 }] : [{ m: 'obliques' }, { m: 'abs', scale: 0.55 }, { m: 'delts', side: 'l', scale: 0.45 }],
    dynamic: spec.dumbbell ? [frontDumbbell('r', 'end')] : undefined,
    pose,
  };
}

/** Seated on a stability ball, with both soles planted. The left load hangs while the trunk bends right. */
export function stabilityBallSeated(spec: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const tl = workTL(0.35);
  const pose = (t: number): FrontPose => {
    const p = tl.at(t).p;
    return {
      pelvis: [0, 151, 0], spine: { roll: -25 * p }, head: { roll: 3 * p },
      legs: { l: { target: [43, BODY.ankleH, 20] }, r: { target: [-43, BODY.ankleH, 20] } },
      arms: {
        l: { target: (J) => add3(J.shoulder_l, [0, -105, 16]) },
        r: { target: (J) => add3(J.B(0.22), [-22, -9, 26]) },
      },
    };
  };
  return {
    id: spec.id, name: spec.name, view: 'front', tl, meta: { en: spec.en, family: 'core-lateral', equipment: ['stability-ball', 'dumbbell'], sources: spec.sources },
    muscles: [{ m: 'obliques' }, { m: 'abs', scale: 0.55 }],
    dynamic: [stabilityBall(() => ({ p: [0, G - BALL.r] })), frontDumbbell('l', 'end')], pose,
  };
}
