// Family-local upper-body stretch builders. Every variation uses an IK target for the working hand or fixed support.
// Standing feet remain planted; alternating unilateral stretches return through neutral before the other side.
import type { FrontExercise, LibraryMeta, MuscleSpec, SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import { timeline, type Timeline } from '@/math/timeline.ts';
import { add3, type Vec3 } from '@/math/vec3.ts';
import { BODY, GROUND, type Joints, type Pose } from '@/rig/side.ts';
import { project, type FrontJoints } from '@/rig/front.ts';
import { A, FLOOR, G, QUAD, kneelLeg, plantedArm, standLegs } from '@/exercises/common.ts';
import { BALL, foamRoller, pullUpBar, stabilityBall, dumbbell } from '@/exercises/equipment/index.ts';

export type Details = { id: string; name: string; en: string; equipment: LibraryMeta['equipment']; sources: string[] };
type FrontKind = 'behind-head' | 'neck-assisted' | 'neck-free' | 'side-wrist' | 'cross-shoulder' | 'cross-triceps' | 'wrist-pull' | 'elbows-back' | 'kneeling-lat' | 'standing-side' | 'stick' | 'ball-seated-lat';
type SideKind = 'side-lying-lat' | 'ball-side-lying-lat' | 'ball-single-chest' | 'biceps' | 'chest-front' | 'kneeling-forearm' | 'overhead-triceps' | 'chin-chest' | 'wall-lat' | 'upper-back' | 'ball-triceps' | 'roller-seated-forward' | 'roller-seated-raise' | 'roller-standing-lat' | 'chair-chest' | 'supported-hang';

const staticTL = (): Timeline => timeline([
  { d: 1.7, from: 0, to: 1, e: [0.2, 0.85] }, { d: 3.2, from: 1, to: 1, e: [0.85, 0.8] },
  { d: 1.7, from: 1, to: 0, e: [0.8, 0.25] }, { d: 0.5, from: 0, to: 0, e: [0.25, 0.2] },
]);
const alternateTL = (): Timeline => timeline([
  { d: 1.35, from: 0, to: 1, e: [0.2, 0.85] }, { d: 2.25, from: 1, to: 1, e: [0.85, 0.8] },
  { d: 1.35, from: 1, to: 0, e: [0.8, 0.2] }, { d: 0.35, from: 0, to: 0, e: [0.2, 0.2] },
  { d: 1.35, from: 0, to: -1, e: [0.2, 0.85] }, { d: 2.25, from: -1, to: -1, e: [0.85, 0.8] },
  { d: 1.35, from: -1, to: 0, e: [0.8, 0.2] }, { d: 0.35, from: 0, to: 0, e: [0.2, 0.2] },
]);
const meta = (d: Details): LibraryMeta => ({ en: d.en, family: 'stretch-upper', equipment: d.equipment, sources: d.sources });
const sign = (s: 'l' | 'r') => s === 'l' ? 1 : -1;
const legs = { l: { target: [17, BODY.ankleH, 2] as Vec3 }, r: { target: [-17, BODY.ankleH, 2] as Vec3 } };
const standingPelvis = (): Vec3 => [0, BODY.ankleH + 183, 0];
const pt = (J: FrontJoints, s: 'l' | 'r', x: number, y: number, z: number): Vec3 => add3(J[`shoulder_${s}`], [x, y, z]);
const resting = (s: 'l' | 'r') => ({ target: (J: FrontJoints) => pt(J, s, 0, -118, 12) });

/** Front builder: large frontal-plane ranges show hand-to-head, crossed-arm, and side-bend stretches clearly. */
export function frontUpper(d: Details, kind: FrontKind, muscles: MuscleSpec[]): FrontExercise {
  const unilateral = !['behind-head', 'elbows-back', 'stick'].includes(kind);
  const tl = unilateral ? alternateTL() : staticTL();
  const ball = kind === 'ball-seated-lat';
  return {
    id: d.id, name: d.name, view: 'front', tl, meta: meta(d), muscles,
    poster: unilateral ? 0.18 : 0.3,
    dynamic: kind === 'stick' ? [{
      nm: 'Stretching stick', kind: 'rigid', z: 'underNearArm',
      shapes: (pal) => [{ kind: 'box', nm: 'stick', color: pal.metal, c: [0, 0], s: [174, 7], r: 3.5 }],
      at: (J: FrontJoints) => ({ p: project([(J.wrist_l[0] + J.wrist_r[0]) / 2, (J.wrist_l[1] + J.wrist_r[1]) / 2, (J.wrist_l[2] + J.wrist_r[2]) / 2]), a: 0 }),
    }] : ball ? [stabilityBall<FrontJoints>(() => ({ p: [0, G - BALL.r] }), 'back')] : undefined,
    pose(t) {
      const raw = tl.at(t).p, q = Math.abs(raw), active = raw >= 0 ? 'l' : 'r', s = sign(active);
      const base = {
        pelvis: ball ? ([0, 150, 0] as Vec3) : standingPelvis(),
        legs: ball ? { l: { target: [72, BODY.ankleH, 5] as Vec3 }, r: { target: [-72, BODY.ankleH, 5] as Vec3 } } : legs,
        arms: { l: resting('l'), r: resting('r') },
      };
      if (kind === 'behind-head') return { ...base, arms: {
        l: { target: (J: FrontJoints) => pt(J, 'l', lerp(0, 24, q), lerp(-118, 78, q), 20), pole: [78, 16, 38] },
        r: { target: (J: FrontJoints) => pt(J, 'r', lerp(0, -24, q), lerp(-118, 78, q), 20), pole: [-78, 16, 38] },
      } };
      if (kind === 'neck-assisted' || kind === 'neck-free') {
        const hand = kind === 'neck-assisted'
          ? { target: (J: FrontJoints) => pt(J, active, -s * 22 * q, lerp(-118, 92, q), 34), pole: [-s * 74, 14, 42] as Vec3 }
          : resting(active);
        return { ...base, spine: { roll: s * 2 * q }, neck: { roll: s * 11 * q }, head: { roll: s * 13 * q }, arms: active === 'l' ? { l: hand, r: resting('r') } : { l: resting('l'), r: hand } };
      }
      if (kind === 'side-wrist') {
        const target = (J: FrontJoints) => pt(J, active, s * 118 * q, 0, 18);
        const assist = (J: FrontJoints) => pt(J, active === 'l' ? 'r' : 'l', s * 107 * q, -4, 42);
        return { ...base, arms: active === 'l' ? { l: { target, pole: [s * 50, -8, 38] }, r: { target: assist, pole: [-s * 35, -10, 58] } } : { l: { target: assist, pole: [-s * 35, -10, 58] }, r: { target, pole: [s * 50, -8, 38] } } };
      }
      if (kind === 'cross-shoulder' || kind === 'cross-triceps') {
        const reach = kind === 'cross-triceps' ? 83 : 103;
        const target = (J: FrontJoints) => pt(J, active, -s * reach * q, kind === 'cross-triceps' ? 24 * q : 0, 58);
        const hold = (J: FrontJoints) => pt(J, active === 'l' ? 'r' : 'l', -s * 40 * q, 5 + 18 * q, 72);
        return { ...base, arms: active === 'l' ? { l: { target, pole: [s * 38, -12, 50] }, r: { target: hold, pole: [-s * 48, -5, 60] } } : { l: { target: hold, pole: [-s * 48, -5, 60] }, r: { target, pole: [s * 38, -12, 50] } } };
      }
      if (kind === 'wrist-pull') {
        const target = (J: FrontJoints) => pt(J, active, -s * lerp(17, 88, q), lerp(-105, 0, q), 55);
        const hold = (J: FrontJoints) => pt(J, active === 'l' ? 'r' : 'l', -s * lerp(12, 78, q), lerp(-103, -5, q), 68);
        return { ...base, arms: active === 'l' ? { l: { target, pole: [s * 34, -18, 54] }, r: { target: hold, pole: [-s * 35, -8, 62] } } : { l: { target: hold, pole: [-s * 35, -8, 62] }, r: { target, pole: [s * 34, -18, 54] } } };
      }
      if (kind === 'elbows-back') return { ...base, arms: {
        l: { target: (J: FrontJoints) => pt(J, 'l', lerp(0, 20, q), lerp(-118, -83, q), lerp(12, -55, q)), pole: [76, 4, -24] },
        r: { target: (J: FrontJoints) => pt(J, 'r', lerp(0, -20, q), lerp(-118, -83, q), lerp(12, -55, q)), pole: [-76, 4, -24] },
      } };
      if (kind === 'kneeling-lat') {
        const h = 92 * q, lean = s * 18 * q;
        return { pelvis: [0, BODY.ankleH + 90, 0], legs: { l: { target: [21, BODY.ankleH, 4] }, r: { target: [-21, BODY.ankleH, 4] } }, spine: { roll: lean }, arms: {
          l: { target: (J: FrontJoints) => pt(J, 'l', 17, h, 30), pole: [60, 25, 45] },
          r: { target: (J: FrontJoints) => pt(J, 'r', -17, h, 30), pole: [-60, 25, 45] },
        } };
      }
      if (kind === 'standing-side') return { ...base, spine: { roll: s * 18 * q }, neck: { roll: s * 5 * q }, head: { roll: s * 4 * q }, arms: {
        l: { target: (J: FrontJoints) => pt(J, 'l', 119, 0, 14), pole: [63, 0, 35] }, r: { target: (J: FrontJoints) => pt(J, 'r', -119, 0, 14), pole: [-63, 0, 35] },
      } };
      if (kind === 'stick') return { ...base, arms: {
        l: { target: (J: FrontJoints) => pt(J, 'l', 70, lerp(-100, 76, q), lerp(-22, 18, q)), pole: [65, 15, 45] },
        r: { target: (J: FrontJoints) => pt(J, 'r', -70, lerp(-100, 76, q), lerp(-22, 18, q)), pole: [-65, 15, 45] },
      } };
      // Sitting on the ball: one hand reaches overhead while the torso leans to the other side.
      const overhead = (J: FrontJoints) => pt(J, active, s * 17, lerp(-110, 112, q), 25);
      return { ...base, spine: { roll: -s * 17 * q }, arms: active === 'l' ? { l: { target: overhead, pole: [s * 52, 26, 45] }, r: resting('r') } : { l: resting('l'), r: { target: overhead, pole: [s * 52, 26, 45] } } };
    },
  };
}

const sideStand = (): Omit<Pose, 'arms'> => ({ hip: [256, G - A - 183], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, legs: standLegs(256, 0), farHip: 0 });
const arm = (a1: number, a2: number, hand = a2) => ({ near: { a1, a2, hand }, far: { a1: a1 + 2, a2: a2 + 2, hand: hand + 2 } });

/** Side builder: uses the sagittal rig for floor, seated, wall, roller, and hanging positions. */
export function sideUpper(d: Details, kind: SideKind, muscles: MuscleSpec[]): SideExercise {
  const unilateral = ['side-lying-lat', 'ball-side-lying-lat', 'ball-single-chest', 'overhead-triceps', 'wall-lat', 'ball-triceps', 'supported-hang'].includes(kind);
  const tl = unilateral ? alternateTL() : staticTL();
  const bar = kind === 'supported-hang' ? pullUpBar({ view: 'side', x: 290, y: 112 }) : undefined;
  return {
    id: d.id, name: d.name, tl, meta: meta(d), muscles, mat: ['side-lying-lat', 'ball-side-lying-lat', 'ball-single-chest', 'kneeling-forearm', 'chin-chest', 'roller-seated-forward', 'roller-seated-raise'].includes(kind),
    poster: unilateral ? 0.18 : 0.3,
    props: bar ? (pal) => ({ back: bar.draw(pal) }) : kind === 'wall-lat' ? (pal) => ({ back: [
      { kind: 'box', nm: 'wall', color: pal.prop, c: [369, 274], s: [18, 332], r: 3 }, { kind: 'box', nm: 'wall-edge', color: pal.metalDark, c: [360, 274], s: [4, 332], r: 2 },
    ] }) : kind === 'chair-chest' ? (pal) => ({ back: [
      { kind: 'box', nm: 'chair-seat', color: pal.pad, c: [230, 375], s: [115, 18], r: 7 }, { kind: 'box', nm: 'chair-back', color: pal.padFar, c: [169, 294], s: [14, 158], r: 5 },
      { kind: 'box', nm: 'chair-leg-front', color: pal.metalDark, c: [271, 414], s: [10, 73], r: 3 }, { kind: 'box', nm: 'chair-leg-back', color: pal.metalDark, c: [177, 414], s: [10, 73], r: 3 },
    ] }) : undefined,
    propsBox: bar?.box ?? (kind === 'wall-lat' ? [185, 418] : kind === 'chair-chest' ? [158, 280] : undefined),
    dynamic: kind === 'side-lying-lat' ? [] : kind === 'ball-side-lying-lat' ? [stabilityBall<Joints>(() => ({ p: [150, G - BALL.r] }), 'back')] : kind === 'ball-single-chest' ? [stabilityBall<Joints>(() => ({ p: [270, G - BALL.r] }), 'back')] : kind === 'ball-triceps' ? [stabilityBall<Joints>(() => ({ p: [225, G - BALL.r] }), 'back'), dumbbell('n', 'profile')] : kind === 'roller-seated-forward' || kind === 'roller-seated-raise' || kind === 'roller-standing-lat' ? [foamRoller<Joints>((J) => ({ p: J.wrist_n, a: kind === 'roller-standing-lat' ? 0 : 90 }), 'end', 'underNearArm')] : undefined,
    pose(t) {
      const raw = tl.at(t).p, q = Math.abs(raw);
      if (kind === 'side-lying-lat' || kind === 'ball-side-lying-lat') {
        const hip: Vec2 = [272, kind === 'ball-side-lying-lat' ? 338 : FLOOR - 42];
        return { hip, spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180, farHip: 0, farShoulder: 0,
          legs: { near: { a1: -35, a2: 35, foot: 0 }, far: { a1: 0, a2: 0, foot: 0 } },
          arms: { near: { a1: -180, a2: -180, hand: -180 }, far: { a1: lerp(0, -180, q), a2: lerp(0, -180, q), hand: lerp(0, -180, q) } } };
      }
      if (kind === 'ball-single-chest') {
        return { hip: QUAD.hip, spine: { lumbar: lerp(QUAD.spine.lumbar, -5, q), thoracic: lerp(QUAD.spine.thoracic, -7, q) }, neck: lerp(-12, -5, q), head: lerp(-10, -5, q), farHip: 0, farShoulder: 0,
          legs: { near: kneelLeg(QUAD.hip), far: kneelLeg(QUAD.hip) },
          arms: { near: { target: [245, G - BALL.d + 4], side: [-1, 0], hand: 0 }, far: plantedArm(QUAD.wristFar) } };
      }
      if (kind === 'biceps') return { ...sideStand(), arms: arm(lerp(94, 128, q), lerp(94, 128, q), lerp(92, 128, q)) };
      if (kind === 'chest-front') return { ...sideStand(), spine: { lumbar: -90, thoracic: lerp(-90, -78, q) }, arms: arm(lerp(18, 12, q), lerp(18, 12, q), 0) };
      if (kind === 'kneeling-forearm') {
        const hip: Vec2 = [QUAD.hip[0] - 18 * q, QUAD.hip[1]];
        return { hip, spine: QUAD.spine, neck: -12, head: -10, farHip: 0, farShoulder: 0, legs: { near: kneelLeg(hip), far: kneelLeg(hip) }, arms: { near: { target: QUAD.wrist, side: [-1, 0], hand: 180 }, far: { target: QUAD.wristFar, side: [-1, 0], hand: 180 } } };
      }
      if (kind === 'overhead-triceps') {
        const base = sideStand();
        return { ...base, arms: { near: { target: (J: Joints) => add(J.N, [lerp(8, -16, q), lerp(-14, 31, q)]), side: [-1, 0], hand: 165 }, far: { target: (J: Joints) => add(J.elbow_n, [-7, -3]), side: [-1, 0], hand: 180 } } };
      }
      if (kind === 'chin-chest') {
        const hip: Vec2 = [175, G - 86], ankle: Vec2 = [338, G - A - 10];
        return { hip, spine: { lumbar: -84, thoracic: -88 }, neck: lerp(-89, -35, q), head: lerp(-90, -20, q), farHip: 0,
          legs: { near: { target: ankle, side: [0, -1], foot: -70 }, far: { target: add(ankle, [-5, 0]), side: [0, -1], foot: -70 } },
          arms: { near: { target: (J: Joints) => add(J.N, [-13, 0]), side: [-1, 0], hand: 180 }, far: { target: (J: Joints) => add(J.N, [-10, 3]), side: [-1, 0], hand: 180 } } };
      }
      if (kind === 'wall-lat') return { hip: [250, G - A - 183], spine: { lumbar: lerp(-90, -72, q), thoracic: lerp(-90, -69, q) }, neck: -72, head: -72, legs: standLegs(250, 0), farHip: 0,
        arms: { near: { target: [360, 245], side: [-1, 0], hand: 0 }, far: { a1: 94, a2: 98, hand: 98 } } };
      if (kind === 'upper-back') return { ...sideStand(), spine: { lumbar: -90, thoracic: lerp(-90, -78, q) }, neck: -86, head: -84,
        arms: { near: { target: [lerp(315, 360, q), lerp(180, 170, q)], side: [-1, 0], hand: 0 }, far: { target: [lerp(312, 357, q), lerp(183, 173, q)], side: [-1, 0], hand: 0 } } };
      if (kind === 'ball-triceps') {
        const hip: Vec2 = [225, G - BALL.d - 15], ankle: Vec2 = [342, G - A];
        return { hip, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, farHip: 0,
          legs: { near: { target: ankle, side: [0, -1], foot: 0 }, far: { target: add(ankle, [-6, 0]), side: [0, -1], foot: 0 } },
          arms: { near: { target: (J: Joints) => add(J.N, [4, lerp(-101, -45, q)]), side: [-1, 0], hand: -90 }, far: { a1: 100, a2: 104, hand: 104 } } };
      }
      if (kind === 'roller-seated-forward' || kind === 'roller-seated-raise') {
        const hip: Vec2 = [164, G - 83], ankle: Vec2 = [338, G - A - 9], y = kind === 'roller-seated-raise' ? lerp(323, 205, q) : 323;
        return { hip, spine: { lumbar: -84, thoracic: lerp(-88, kind === 'roller-seated-forward' ? -63 : -88, q) }, neck: -88, head: -90, farHip: 0,
          legs: { near: { target: ankle, side: [0, -1], foot: -70 }, far: kind === 'roller-seated-raise' ? { target: [246, G - A - 3], side: [0, -1], foot: -20 } : { target: add(ankle, [-5, 0]), side: [0, -1], foot: -70 } },
          arms: { near: { target: [lerp(260, 300, kind === 'roller-seated-forward' ? q : 0), lerp(y, 315, kind === 'roller-seated-forward' ? q : 0)], side: [-1, 0], hand: 90 }, far: { target: [lerp(254, 294, kind === 'roller-seated-forward' ? q : 0), lerp(y + 3, 318, kind === 'roller-seated-forward' ? q : 0)], side: [-1, 0], hand: 90 } } };
      }
      if (kind === 'roller-standing-lat') return { hip: [256, G - A - 183], spine: { lumbar: lerp(-90, -15, q), thoracic: lerp(-90, -16, q) }, neck: lerp(-90, -16, q), head: lerp(-90, -15, q), legs: standLegs(256, 0), farHip: 0,
        arms: { near: { target: [lerp(300, 385, q), lerp(250, 330, q)], side: [-1, 0], hand: 0 }, far: { target: [lerp(300, 385, q), lerp(250, 330, q)], side: [-1, 0], hand: 0 } } };
      if (kind === 'chair-chest') return { hip: [238, 357], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, farHip: 0,
        legs: { near: { target: [293, G - A], side: [0, -1], foot: 0 }, far: { target: [287, G - A], side: [0, -1], foot: 0 } },
        arms: { near: { target: [167, lerp(347, 281, q)], side: [1, 0], hand: 180 }, far: { target: [172, lerp(350, 284, q)], side: [1, 0], hand: 180 } } };
      // Supported one-arm hang: the feet stay planted while one hand takes the bar and the other rests at the side.
      return { hip: [258, G - A - lerp(183, 164, q)], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, legs: standLegs(258, 0), farHip: 0,
        arms: { near: { target: [290, 112], side: [-1, 0], hand: -90 }, far: { a1: 92, a2: 96, hand: 96 } } };
    },
  };
}
