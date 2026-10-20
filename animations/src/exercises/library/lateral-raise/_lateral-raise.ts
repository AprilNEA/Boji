// Family-local builders for lateral raises. Standing and seated bases keep both feet flat and the torso quiet.
// Every raise uses a constant shoulder-to-wrist reach, so elbows stay softly bent without IK stretch.
// Cables, bands, machine grips and landmine bars follow the hand that holds them.
import type { FrontExercise, Props } from '@/exercise.ts';
import { D2R, lerp, smooth, timeline, type Timeline, type Vec2 } from '@/math.ts';
import { add3, dot3, lerp3, mul3, norm3, sub3, type Vec3 } from '@/math3.ts';
import { FB, project, type FSide, type FrontJoints } from '@/front-rig.ts';
import type { Palette } from '@/palettes.ts';
import { BODY, GROUND } from '@/rig.ts';
import {
  bandLine, cableColumn, cableHandle, cableLine, flatBench, frontDumbbell, frontGripAt, inclineBench, landmine, towardCable, workTL,
} from '@/exercises/equipment/index.ts';

const G = GROUND;
const REACH = BODY.upper + BODY.fore - 1.5;
const LOW = 8;
const HIGH = 86;
const SIGN: Record<FSide, number> = { l: 1, r: -1 };
const normalTL = workTL(0.35);
const seatedBench = flatBench({ view: 'front', x: 0, top: 90 });
// The front rig still needs a visible bench profile for the forward-leaning one-arm variation.
const inclineSeat = inclineBench({ x: 30, angle: 65, top: 90, back: 160, seat: 72, facing: 1 });

export type Common = { id: string; name: string; en: string; sources: string[] };

type RaiseOptions = {
  seated?: boolean;
  incline?: boolean;
  bent?: boolean;
  unilateral?: boolean;
  alternating?: boolean;
  support?: 'upright' | 'lean-away';
  scaption?: number;
  lowCross?: boolean;
};

function standingBase(lean = 0) {
  return {
    pelvis: [0, BODY.ankleH + 183, 0] as Vec3,
    hips: { pitch: 2 }, spine: { roll: lean, pitch: -1 }, head: { pitch: -2 },
    legs: { l: { target: [21, BODY.ankleH, 3] as Vec3 }, r: { target: [-21, BODY.ankleH, -3] as Vec3 } },
  };
}

function seatedBase() {
  return {
    pelvis: [0, 140, 0] as Vec3,
    hips: { pitch: 3 }, spine: { pitch: -2 }, head: { pitch: -2 },
    // Feet are broad and flat under the knees. The front bench pad remains behind the pelvis.
    legs: { l: { target: [58, BODY.ankleH, 12] as Vec3 }, r: { target: [-58, BODY.ankleH, 7] as Vec3 } },
  };
}

function inclinedSeatedBase() {
  return {
    pelvis: [0, 140, 0] as Vec3,
    // The lifter sits forward and folds toward the working thigh. The incline bench stays behind the torso.
    hips: { pitch: 12 }, spine: { pitch: 18 }, neck: { pitch: -8 }, head: { pitch: -12 },
    legs: { l: { target: [58, BODY.ankleH, 16] as Vec3 }, r: { target: [-58, BODY.ankleH, 16] as Vec3 } },
  };
}

/** A lateral or scapular-plane arc. Top shoulder elevation is 86 degrees and the elbow remains softly bent. */
function lateralTarget(s: FSide, p: number, J: FrontJoints, scapular = 15, reach = REACH): Vec3 {
  const elev = lerp(LOW, HIGH, p) * D2R;
  // The arm moves 10–30 degrees forward of the frontal plane. Scaption moves 30 degrees forward at the top.
  const fwd = lerp(12, Math.max(12, scapular), p) * D2R;
  const horizontal = Math.sin(elev) * reach;
  const z = Math.sin(fwd) * horizontal + 12;
  const x = SIGN[s] * Math.cos(fwd) * horizontal;
  const y = -Math.cos(elev) * reach;
  const v = norm3([x, y, z]);
  return add3(J[`shoulder_${s}`], mul3(v, reach));
}

/** A bent-arm raise leads with the elbow. At the top, the upper arm is lateral and the forearm hangs vertically. */
function bentArm(s: FSide, p: number, J: FrontJoints): { target: Vec3; pole: Vec3 } {
  const elev = lerp(32, HIGH, p) * D2R;
  const fwd = 12 * D2R;
  const horizontal = Math.sin(elev);
  const upper = norm3([
    SIGN[s] * Math.cos(fwd) * horizontal,
    -Math.cos(elev),
    Math.sin(fwd) * horizontal,
  ]);
  // Project down onto the plane normal to the upper arm. This keeps the elbow at 90 degrees throughout.
  const down: Vec3 = [0, -1, 0];
  const fore = norm3(sub3(down, mul3(upper, dot3(down, upper))));
  return {
    target: add3(J[`shoulder_${s}`], add3(mul3(upper, BODY.upper), mul3(fore, BODY.fore))),
    pole: upper,
  };
}

function restingTarget(s: FSide, J: FrontJoints): Vec3 {
  return lateralTarget(s, 0, J, 12);
}

function supportProps(): (pal: Parameters<NonNullable<FrontExercise['props']>>[0]) => Props {
  return (pal) => ({ back: [
    { kind: 'box', nm: 'support-post', color: pal.prop, c: [-104, 255], s: [20, 382], r: 4 },
    { kind: 'box', nm: 'support-grip', color: pal.padFar, c: [-81, 222], s: [42, 10], r: 5 },
    { kind: 'box', nm: 'support-foot', color: pal.metalDark, c: [-104, G - 4], s: [76, 8], r: 3 },
  ] });
}

function supportArm(J: FrontJoints): Vec3 {
  // The free hand holds a chest-height support. It stays within normal elbow reach.
  return [-80, 230, 0] as Vec3;
}

const alternateTL: Timeline = timeline([
  { d: 1, from: 0, to: 1, e: [0.35, 1] }, { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.3, from: 0, to: 0, e: [0.3, 0.3] },
  { d: 1, from: 0, to: 1, e: [0.35, 1] }, { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.3, from: 0, to: 0, e: [0.3, 0.3] },
]);

function repProgress(u: number): number {
  if (u <= 1) return smooth(u);
  if (u <= 1.35) return 1;
  if (u <= 2.95) return 1 - smooth((u - 1.35) / 1.6);
  return 0;
}

function alternatingProgress(t: number): [number, number] {
  const x = t * alternateTL.total;
  return x < 3.25 ? [repProgress(x), 0] : [0, repProgress(x - 3.25)];
}

/** Standard dumbbell lateral raise family. The unilateral variants train the visible left side; sources instruct switching sides separately. */
export function dumbbellLateral(c: Common, o: RaiseOptions = {}): FrontExercise {
  const tl = o.alternating ? alternateTL : normalTL;
  const active: FSide = 'l';
  const equipment = o.seated ? ['dumbbell', 'bench'] as const : ['dumbbell'] as const;
  const bench = o.incline ? inclineSeat : seatedBench;
  return {
    id: c.id, name: c.name, view: 'front', tl,
    meta: { en: c.en, family: 'lateral-raise', equipment: [...equipment], sources: c.sources },
    muscles: [
      { m: 'delts', side: o.unilateral ? active : 'both' },
      { m: 'traps', scale: 0.3 },
      ...(o.alternating ? [{ m: 'forearms' as const, side: 'both' as const, scale: 0.25 }] : []),
    ],
    props: o.seated ? (pal) => ({ back: bench.draw(pal) }) : o.support ? supportProps() : undefined,
    propsBox: o.seated ? bench.box : o.support ? [-142, 90] : undefined,
    dynamic: o.unilateral
      ? [frontDumbbell(active, 'end')]
      : [frontDumbbell('l', 'end'), frontDumbbell('r', 'end')],
    pose(t) {
      const phase = tl.at(t);
      const [pl, pr] = o.alternating ? alternatingProgress(t) : [phase.p, phase.p];
      const arm = (s: FSide, p: number) => o.bent
        ? { target: (J: FrontJoints) => bentArm(s, p, J).target, pole: (J: FrontJoints) => bentArm(s, p, J).pole }
        : { target: (J: FrontJoints) => lateralTarget(s, p, J, o.scaption ?? 15) };
      const base = o.seated ? (o.incline ? inclinedSeatedBase() : seatedBase()) : standingBase(o.support === 'lean-away' ? 6 : 0);
      if (o.unilateral) {
        const working = (J: FrontJoints) => {
          if (!o.lowCross) return o.bent ? bentArm(active, phase.p, J).target : lateralTarget(active, phase.p, J, o.scaption ?? 15);
          const start = [-46, -112, 22] as Vec3;
          const end = [116, 0, 38] as Vec3;
          return add3(J.shoulder_l, mul3(norm3(lerp3(start, end, phase.p)), REACH));
        };
        return {
          ...base,
          arms: {
            l: { target: working, ...(o.bent ? { pole: (J: FrontJoints) => bentArm(active, phase.p, J).pole } : {}) },
            r: o.support ? { target: supportArm } : { target: (J: FrontJoints) => restingTarget('r', J) },
          },
        };
      }
      return { ...base, arms: { l: arm('l', pl), r: arm('r', pr) } };
    },
  };
}

/** Two low pulleys stay outboard of the hands, so both cable paths are visible throughout the lateral arc. */
export function cableLateral(c: Common): FrontExercise {
  const left = cableColumn({ x: -205, pulleyY: G - 28, toward: 1 });
  const right = cableColumn({ x: 205, pulleyY: G - 28, toward: -1 });
  return {
    id: c.id, name: c.name, view: 'front', tl: normalTL,
    meta: { en: c.en, family: 'lateral-raise', equipment: ['cable'], sources: c.sources },
    muscles: [{ m: 'delts' }, { m: 'traps', scale: 0.3 }],
    props: (pal) => ({ back: [...left.draw(pal), ...right.draw(pal)] }), propsBox: [left.box[0], right.box[1]],
    dynamic: [
      cableLine(left.pulley, (J: FrontJoints) => frontGripAt(J, 'l'), 'Left low cable'),
      cableLine(right.pulley, (J: FrontJoints) => frontGripAt(J, 'r'), 'Right low cable'),
      cableHandle('d', (J: FrontJoints) => { const p = frontGripAt(J, 'l'); return { p, a: towardCable(p, left.pulley) }; }, { z: 'front' }),
      cableHandle('d', (J: FrontJoints) => { const p = frontGripAt(J, 'r'); return { p, a: towardCable(p, right.pulley) }; }, { z: 'front' }),
    ],
    pose: (t) => ({ ...standingBase(), arms: {
      l: { target: (J: FrontJoints) => lateralTarget('l', normalTL.at(t).p, J, 14) },
      r: { target: (J: FrontJoints) => lateralTarget('r', normalTL.at(t).p, J, 14) },
    } }),
  };
}

/** The single low pulley starts across the body. The opposite hand stays on the tower for balance. */
export function singleCableLateral(c: Common): FrontExercise {
  const tower = cableColumn({ x: -170, pulleyY: G - 28, toward: 1 });
  return {
    id: c.id, name: c.name, view: 'front', tl: normalTL,
    meta: { en: c.en, family: 'lateral-raise', equipment: ['cable'], sources: c.sources },
    muscles: [{ m: 'delts', side: 'l' }, { m: 'forearms', side: 'l', scale: 0.35 }, { m: 'traps', scale: 0.25 }],
    props: (pal) => ({ back: [...tower.draw(pal), ...supportProps()(pal).back!] }), propsBox: [tower.box[0], 92],
    dynamic: [
      cableLine(tower.pulley, (J: FrontJoints) => frontGripAt(J, 'l'), 'Cross-body low cable'),
      cableHandle('d', (J: FrontJoints) => { const p = frontGripAt(J, 'l'); return { p, a: towardCable(p, tower.pulley) }; }, { z: 'front' }),
    ],
    pose: (t) => ({ ...standingBase(), arms: {
      l: { target: (J: FrontJoints) => {
        const start = [-46, -112, 22] as Vec3, end = [116, 0, 38] as Vec3;
        return add3(J.shoulder_l, mul3(norm3(lerp3(start, end, normalTL.at(t).p)), REACH));
      } },
      r: { target: supportArm },
    } }),
  };
}

/** The band is anchored under each planted foot and remains taut as both handles rise. */
export function bandLateral(c: Common): FrontExercise {
  return {
    id: c.id, name: c.name, view: 'front', tl: normalTL,
    meta: { en: c.en, family: 'lateral-raise', equipment: ['band'], sources: c.sources },
    muscles: [{ m: 'delts' }, { m: 'traps', scale: 0.25 }],
    dynamic: [
      bandLine((J: FrontJoints) => [[project(J.ankle_l)[0], G - 5], frontGripAt(J, 'l')], 'front', 'Left resistance band'),
      bandLine((J: FrontJoints) => [[project(J.ankle_r)[0], G - 5], frontGripAt(J, 'r')], 'front', 'Right resistance band'),
    ],
    pose: (t) => ({ ...standingBase(), arms: {
      l: { target: (J: FrontJoints) => lateralTarget('l', normalTL.at(t).p, J, 15) },
      r: { target: (J: FrontJoints) => lateralTarget('r', normalTL.at(t).p, J, 15) },
    } }),
  };
}

const mixedTL = timeline([
  { d: 1, from: 0, to: 1, e: [0.35, 1] }, { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.3, from: 0, to: 0, e: [0.3, 0.3] },
  { d: 1, from: 0, to: 1, e: [0.35, 1] }, { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.3, from: 0, to: 0, e: [0.3, 0.3] },
]);

function frontTarget(s: FSide, p: number, J: FrontJoints): Vec3 {
  const elev = p * Math.PI / 2;
  const v = norm3([SIGN[s] * 5 * p, -Math.cos(elev) * REACH, 16 + Math.sin(elev) * REACH]);
  return add3(J[`shoulder_${s}`], mul3(v, REACH));
}

/** One controlled bilateral lateral raise, followed by one controlled bilateral front raise. */
export function lateralToFront(c: Common): FrontExercise {
  return {
    id: c.id, name: c.name, view: 'front', tl: mixedTL, poster: 0.17,
    meta: { en: c.en, family: 'lateral-raise', equipment: ['dumbbell'], sources: c.sources },
    muscles: [{ m: 'delts' }, { m: 'traps', scale: 0.3 }], dynamic: [frontDumbbell('l', 'profile'), frontDumbbell('r', 'profile')],
    pose(t) {
      const first = t < 0.5;
      const p = first ? repProgress(t * mixedTL.total) : repProgress(t * mixedTL.total - 3.25);
      const target = (s: FSide, J: FrontJoints) => first ? lateralTarget(s, p, J, 15) : frontTarget(s, p, J);
      return { ...standingBase(), arms: { l: { target: (J: FrontJoints) => target('l', J) }, r: { target: (J: FrontJoints) => target('r', J) } } };
    },
  };
}

/** A complete arm circle starts and ends at the shoulder-height T position, passes in front, then overhead. */
export function aroundWorld(c: Common): FrontExercise {
  const tl = timeline([{ d: 3.5, from: 0, to: 1, e: [0.45, 0.85] }]);
  const path = (s: FSide, u: number): Vec3 => {
    const points: Vec3[] = [[SIGN[s], 0, 0], [SIGN[s] * 0.04, 0, 1], [0, 1, 0], [SIGN[s] * 0.04, 0, 1], [SIGN[s], 0, 0]];
    const k = Math.min(3, Math.floor(u * 4));
    return norm3(lerp3(points[k]!, points[k + 1]!, smooth(u * 4 - k)));
  };
  return {
    id: c.id, name: c.name, view: 'front', tl, poster: 0.5,
    meta: { en: c.en, family: 'lateral-raise', equipment: ['dumbbell'], sources: c.sources },
    muscles: [{ m: 'delts' }, { m: 'forearms', scale: 0.25 }],
    dynamic: [frontDumbbell('l', 'profile'), frontDumbbell('r', 'profile')],
    pose(t) {
      const u = tl.at(t).p;
      return { ...standingBase(), arms: {
        l: { target: (J: FrontJoints) => add3(J.shoulder_l, mul3(path('l', u), REACH)) },
        r: { target: (J: FrontJoints) => add3(J.shoulder_r, mul3(path('r', u), REACH)) },
      } };
    },
  };
}

/** One arm lifts the free end of a floor-anchored bar from the front shoulder into the lateral raise position. */
export function landmineLateral(c: Common): FrontExercise {
  const pivot: Vec2 = [0, G - 6];
  const mine = landmine(pivot, (J: FrontJoints) => frontGripAt(J, 'l'), 'front', 36, 'medium');
  return {
    id: c.id, name: c.name, view: 'front', tl: normalTL,
    meta: { en: c.en, family: 'lateral-raise', equipment: ['landmine'], sources: c.sources },
    muscles: [{ m: 'delts', side: 'l' }, { m: 'traps', scale: 0.3 }, { m: 'upperBack', side: 'l', scale: 0.3, region: { view: 'front', part: 'traps', c: [12, 1], s: [13, 7], mirror: true } }],
    props: (pal) => ({ back: mine.base(pal) }), propsBox: [-55, 116], dynamic: mine.parts,
    pose(t) {
      const p = normalTL.at(t).p;
      return { ...standingBase(), arms: {
        l: { target: (J: FrontJoints) => {
          const start = norm3([30, -38, 112] as Vec3);
          const end = norm3([111, 0, 36] as Vec3);
          return add3(J.shoulder_l, mul3(norm3(lerp3(start, end, p)), REACH));
        } },
        r: { target: (J: FrontJoints) => restingTarget('r', J) },
      } };
    },
  };
}

/** Seated lateral-raise machine. The back pad and seat fix the torso while both overhand grips follow the handles. */
export function machineLateral(c: Common): FrontExercise {
  const lever = (s: FSide) => ({
    nm: `${s === 'l' ? 'Left' : 'Right'} machine lever`, kind: 'line' as const, z: 'back' as const, width: 10,
    color: (pal: Palette) => pal.metal,
    at: (J: FrontJoints): [Vec2, Vec2] => [[SIGN[s] * 118, 185], frontGripAt(J, s)],
  });
  const handle = (s: FSide) => ({
    nm: `${s === 'l' ? 'Left' : 'Right'} machine grip`, kind: 'rigid' as const, z: 'front' as const,
    shapes: (pal: Parameters<NonNullable<FrontExercise['props']>>[0]) => [{ kind: 'box' as const, nm: 'grip', color: pal.padFar, c: [0, 0] as Vec2, s: [22, 9] as Vec2, r: 4.5 }],
    at: (J: FrontJoints) => ({ p: frontGripAt(J, s), a: 0 }),
  });
  return {
    id: c.id, name: c.name, view: 'front', tl: normalTL,
    meta: { en: c.en, family: 'lateral-raise', equipment: ['machine'], sources: c.sources },
    muscles: [{ m: 'delts' }, { m: 'traps', scale: 0.3 }, { m: 'upperBack', scale: 0.3, region: { view: 'front', part: 'traps', c: [12, 1], s: [13, 7], mirror: true } }],
    props: (pal) => ({ back: [
      { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [0, G - 5], s: [250, 10], r: 3 },
      { kind: 'box', nm: 'machine-back-post', color: pal.metalDark, c: [0, 302], s: [14, 218], r: 4 },
      { kind: 'box', nm: 'machine-back-pad', color: pal.pad, c: [0, 235], s: [74, 170], r: 16 },
      { kind: 'box', nm: 'machine-seat', color: pal.pad, c: [0, 320], s: [104, 18], r: 7 },
      { kind: 'box', nm: 'left-machine-upright', color: pal.prop, c: [-126, 275], s: [16, 324], r: 5 },
      { kind: 'box', nm: 'right-machine-upright', color: pal.prop, c: [126, 275], s: [16, 324], r: 5 },
      { kind: 'box', nm: 'machine-top', color: pal.metal, c: [0, 112], s: [268, 14], r: 5 },
      { kind: 'oval', nm: 'left-lever-pivot', color: pal.metalDark, c: [-118, 185], s: [24, 24] },
      { kind: 'oval', nm: 'right-lever-pivot', color: pal.metalDark, c: [118, 185], s: [24, 24] },
    ] }),
    propsBox: [-145, 145], dynamic: [lever('l'), lever('r'), handle('l'), handle('r')],
    pose: (t) => ({ ...seatedBase(), arms: {
      l: { target: (J: FrontJoints) => lateralTarget('l', normalTL.at(t).p, J, 10, BODY.upper + BODY.fore - 0.4) },
      r: { target: (J: FrontJoints) => lateralTarget('r', normalTL.at(t).p, J, 10, BODY.upper + BODY.fore - 0.4) },
    } }),
  };
}

export { normalTL };
