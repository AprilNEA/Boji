// Private builders for the rear-delt-2 exercises.
// Front views show a bilateral fly path. Side views make the hip hinge, bench contact, and seat contact readable.
// Dumbbells, ropes, and machine handles stay attached to the closed hands throughout each repetition.
import type { FrontExercise, Props, RigidPart, SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import { add3, mul3, norm3, type Vec3 } from '@/math/vec3.ts';
import { type FSide, type FrontJoints, type FrontPose } from '@/rig/front.ts';
import { BODY, GROUND, type Joints } from '@/rig/side.ts';
import { dumbbell, flatBench, frontDumbbell, frontGripAt, inclineBench, workTL } from '@/exercises/equipment/index.ts';

const G = GROUND;
const REACH = BODY.upper + BODY.fore - 1.6;
const SIGN: Record<FSide, number> = { l: 1, r: -1 };
const flyTL = workTL(0.45);

type Common = { id: string; name: string; en: string; sources: string[] };
type Support = 'standing' | 'head' | 'incline' | 'flat' | 'floor' | 'seated';
type FlyOptions = { support?: Support; unilateral?: boolean; rotation?: boolean; straight?: boolean; row?: boolean };

/** The front rig is retained for reverse-fly machines, where the bilateral handle path is clearest. */
function supportProps(kind: Support): (pal: Parameters<NonNullable<FrontExercise['props']>>[0]) => Props {
  const high = kind === 'head' ? 204 : kind === 'incline' ? 232 : kind === 'flat' ? 248 : 278;
  const height = kind === 'head' ? 176 : kind === 'incline' ? 188 : kind === 'flat' ? 138 : 74;
  return (pal) => ({ back: [
    { kind: 'box', nm: 'bench-foot', color: pal.metalDark, c: [0, G - 5], s: [180, 10], r: 3 },
    { kind: 'box', nm: 'bench-post', color: pal.metalDark, c: [0, (high + height / 2 + G) / 2], s: [14, G - high - height / 2], r: 4 },
    { kind: 'box', nm: 'bench-chest-pad', color: pal.pad, c: [0, high], s: [84, height], r: 14 },
    ...(kind === 'head' ? [{ kind: 'box' as const, nm: 'forehead-pad', color: pal.padFar, c: [0, high - height / 2 - 18] as Vec2, s: [68, 14] as Vec2, r: 7 }] : []),
  ] });
}

type BasePose = Omit<FrontPose, 'arms'>;
function standingBase(): BasePose {
  return {
    pelvis: [0, BODY.ankleH + 176, 0],
    hips: { pitch: 58 }, spine: { pitch: 8 }, neck: { pitch: -8 }, head: { pitch: -8 },
    legs: { l: { target: [27, BODY.ankleH, 4] }, r: { target: [-27, BODY.ankleH, -2] } },
  };
}
function seatedBase(): BasePose {
  return {
    pelvis: [0, 143, 3], hips: { pitch: 34 }, spine: { pitch: 8 }, neck: { pitch: 8 }, head: { pitch: 10 },
    legs: { l: { target: [57, BODY.ankleH, 14] }, r: { target: [-57, BODY.ankleH, 8] } },
  };
}
function proneBase(kind: Support): BasePose {
  if (kind === 'floor') return {
    pelvis: [0, 83, -3], hips: { pitch: 76 }, spine: { pitch: 8 }, neck: { pitch: 10 }, head: { pitch: 16 },
    legs: { l: { target: [38, 72, -150] }, r: { target: [-38, 72, -157] } },
  };
  return {
    pelvis: [0, 147, -3], hips: { pitch: 56 }, spine: { pitch: 7 }, neck: { pitch: 9 }, head: { pitch: 12 },
    legs: { l: { target: [43, BODY.ankleH, -38] }, r: { target: [-43, BODY.ankleH, -45] } },
  };
}
function flyTarget(s: FSide, p: number, J: FrontJoints, straight = false, row = false): Vec3 {
  const low: Vec3 = [SIGN[s] * 10, -REACH, 23];
  const top: Vec3 = row ? [SIGN[s] * 86, -26, 7] : [SIGN[s] * (straight ? 112 : 108), straight ? -4 : -14, 25];
  return add3(J[`shoulder_${s}`], mul3(norm3([
    lerp(low[0], top[0], p), lerp(low[1], top[1], p), lerp(low[2], top[2], p),
  ]), REACH));
}
function floorFlyTarget(s: FSide, p: number, J: FrontJoints): Vec3 {
  const low: Vec3 = [SIGN[s] * 8, -6, REACH];
  const top: Vec3 = [SIGN[s] * 108, -6, 20];
  return add3(J[`shoulder_${s}`], mul3(norm3([
    lerp(low[0], top[0], p), lerp(low[1], top[1], p), lerp(low[2], top[2], p),
  ]), REACH));
}
function braceTarget(s: FSide, J: FrontJoints): Vec3 { return add3(J[`shoulder_${s}`], [SIGN[s] * 34, -83, 42]); }
function rotatingDumbbell(s: FSide): RigidPart<FrontJoints> {
  return {
    nm: `${s === 'l' ? 'Left' : 'Right'} rotating dumbbell`, z: 'underNearArm', kind: 'rigid',
    shapes: (pal) => [
      { kind: 'box', nm: 'handle', color: pal.metal, c: [0, 0], s: [24, 5], r: 2.5 },
      { kind: 'box', nm: 'plate-a', color: pal.plate, c: [-16, 0], s: [9, 28], r: 3 },
      { kind: 'box', nm: 'plate-b', color: pal.plate, c: [16, 0], s: [9, 28], r: 3 },
    ],
    at: (J, t) => ({ p: frontGripAt(J, s), a: lerp(90, 0, flyTL.at(t).p) }),
  };
}

/** The front version remains useful for the rotation variations, which need a readable 90 degree grip change. */
export function frontDumbbellFly(c: Common, o: FlyOptions = {}): FrontExercise {
  const support = o.support ?? 'standing'; const unilateral = o.unilateral ?? false; const active: FSide = 'l'; const needsBench = support !== 'standing' && support !== 'floor';
  const base = support === 'seated' ? seatedBase : support === 'incline' || support === 'flat' || support === 'floor' ? () => proneBase(support) : standingBase;
  const dynamics = o.rotation ? (unilateral ? [rotatingDumbbell(active)] : [rotatingDumbbell('l'), rotatingDumbbell('r')]) : (unilateral ? [frontDumbbell(active, 'end')] : [frontDumbbell('l', 'end'), frontDumbbell('r', 'end')]);
  return {
    id: c.id, name: c.name, view: 'front', tl: flyTL,
    meta: { en: c.en, family: 'rear-delt', equipment: needsBench ? ['dumbbell', 'bench'] : ['dumbbell'], sources: c.sources },
    muscles: [{ m: 'delts', side: unilateral ? active : 'both' }, { m: 'traps', scale: 0.4 }, { m: 'upperBack', scale: 0.45, region: { view: 'front', part: 'traps', c: [13, 2], s: [13, 7], r: 20, mirror: true } }],
    props: needsBench ? supportProps(support) : undefined, propsBox: needsBench ? [-98, 98] : undefined,
    dynamic: dynamics,
    pose(t) {
      const p = flyTL.at(t).p; const b = base();
      const loaded = (s: FSide) => ({ target: (J: FrontJoints) => support === 'floor' ? floorFlyTarget(s, p, J) : flyTarget(s, p, J, o.straight, o.row) });
      return { ...b, arms: unilateral ? { l: loaded('l'), r: { target: (J: FrontJoints) => braceTarget('r', J) } } : { l: loaded('l'), r: loaded('r') } };
    },
  };
}

/** Side profile for every chest-supported and hinged variation. It preserves visible bench contact instead of showing an ambiguous upright frontal figure. */
export function dumbbellFly(c: Common, o: FlyOptions = {}): SideExercise {
  const support = o.support ?? 'standing'; const unilateral = o.unilateral ?? false;
  const flat = flatBench({ view: 'side', x: 265, top: 138, length: 220 });
  const inclineAngle = support === 'head' ? 45 : support === 'incline' ? 30 : 15;
  const incline = inclineBench({ x: 302, angle: inclineAngle, top: 108, back: 176, seat: 76, facing: 1 });
  const hasBench = support === 'flat' || support === 'incline' || support === 'head' || support === 'seated';
  const bench = support === 'flat' ? flat : incline;
  const standing = () => ({
    hip: [225, G - 174] as Vec2, spine: { lumbar: -48, thoracic: -48 }, neck: -52, head: -52,
    legs: { near: { target: [244, G - 13] as Vec2, foot: 0, side: [0, 1] as Vec2 }, far: { target: [238, G - 13] as Vec2, foot: 0, side: [0, 1] as Vec2 } },
  });
  const seated = () => ({
    hip: [253, G - 112] as Vec2, spine: { lumbar: -51, thoracic: -51 }, neck: -54, head: -54,
    legs: { near: { target: [342, G - 13] as Vec2, foot: 0, side: [0, 1] as Vec2 }, far: { target: [337, G - 13] as Vec2, foot: 0, side: [0, 1] as Vec2 } },
  });
  const supported = () => ({
    hip: [282, G - 160] as Vec2, spine: { lumbar: support === 'flat' ? -171 : -151, thoracic: support === 'flat' ? -171 : -151 }, neck: support === 'flat' ? -171 : -151, head: support === 'flat' ? -171 : -151,
    legs: { near: { target: [370, G - 13] as Vec2, foot: 0, side: [0, 1] as Vec2 }, far: { target: [364, G - 13] as Vec2, foot: 0, side: [0, 1] as Vec2 } },
  });
  const floor = () => ({
    hip: [292, G - 34] as Vec2, spine: { lumbar: -174, thoracic: -174 }, neck: -174, head: -174,
    legs: { near: { target: [438, G - 13] as Vec2, foot: 0, side: [0, 1] as Vec2 }, far: { target: [432, G - 13] as Vec2, foot: 0, side: [0, 1] as Vec2 } },
  });
  const base = support === 'standing' ? standing : support === 'seated' ? seated : support === 'floor' ? floor : supported;
  const moving = (J: Joints, p: number): Vec2 => {
    const low = support === 'floor' ? [16, 42] as Vec2 : [4, 118] as Vec2;
    const top = o.row ? [-62, 24] as Vec2 : [-106, 8] as Vec2;
    return add(J.S, [lerp(low[0], top[0], p), lerp(low[1], top[1], p)]);
  };
  const brace = (J: Joints): Vec2 => add(J.Sf, support === 'seated' ? [30, 74] : [42, 52]);
  return {
    id: c.id, name: c.name, view: 'side', tl: flyTL,
    meta: { en: c.en, family: 'rear-delt', equipment: hasBench ? ['dumbbell', 'bench'] : ['dumbbell'], sources: c.sources },
    muscles: [{ m: 'delts', side: unilateral ? 'near' : 'both' }, { m: 'traps', scale: 0.4 }, { m: 'upperBack', scale: 0.45 }],
    props: hasBench ? (pal) => ({ back: bench.draw(pal) }) : undefined, propsBox: hasBench ? bench.box : undefined,
    dynamic: unilateral ? [dumbbell('n', 'profile')] : [dumbbell('n', 'profile'), dumbbell('f', 'profile')],
    pose(t) {
      const p = flyTL.at(t).p; const b = base();
      return { ...b, arms: {
        near: { target: (J: Joints) => moving(J, p), side: [-1, 0.2], hand: 90 },
        far: unilateral ? { target: brace, side: [-1, 0.2], hand: 90 } : { target: (J: Joints) => add(moving(J, p), [-6, -3]), side: [-1, 0.2], hand: 90 },
      } };
    },
  };
}

type MachineGrip = 'neutral' | 'overhand';
function machineProps(pal: Parameters<NonNullable<FrontExercise['props']>>[0]): Props { return { back: [
  { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [0, G - 5], s: [292, 10], r: 3 },
  { kind: 'box', nm: 'left-machine-upright', color: pal.prop, c: [-142, 270], s: [18, 334], r: 5 }, { kind: 'box', nm: 'right-machine-upright', color: pal.prop, c: [142, 270], s: [18, 334], r: 5 },
  { kind: 'box', nm: 'machine-top', color: pal.metal, c: [0, 105], s: [302, 14], r: 5 }, { kind: 'box', nm: 'machine-seat', color: pal.pad, c: [0, 326], s: [112, 18], r: 8 }, { kind: 'box', nm: 'machine-chest-pad', color: pal.pad, c: [0, 237], s: [86, 152], r: 15 },
  { kind: 'oval', nm: 'left-machine-pivot', color: pal.metalDark, c: [-128, 193], s: [24, 24] }, { kind: 'oval', nm: 'right-machine-pivot', color: pal.metalDark, c: [128, 193], s: [24, 24] },
] }; }
function machineBase(): BasePose { return { pelvis: [0, 143, 5], hips: { pitch: 4 }, spine: { pitch: -2 }, neck: { pitch: 4 }, head: { pitch: 5, yaw: 180 }, legs: { l: { target: [56, BODY.ankleH, 13] }, r: { target: [-56, BODY.ankleH, 8] } } }; }
function machineTarget(s: FSide, p: number, J: FrontJoints, row: boolean): Vec3 { const low: Vec3 = row ? [SIGN[s] * 74, -75, 48] : [SIGN[s] * 14, -22, 122]; const high: Vec3 = row ? [SIGN[s] * 92, -18, 15] : [SIGN[s] * 108, -12, -12]; return add3(J[`shoulder_${s}`], mul3(norm3([lerp(low[0], high[0], p), lerp(low[1], high[1], p), lerp(low[2], high[2], p)]), REACH)); }
function machineParts(grip: MachineGrip): FrontExercise['dynamic'] { const lever = (s: FSide) => ({ nm: `${s === 'l' ? 'Left' : 'Right'} reverse-fly lever`, kind: 'line' as const, z: 'back' as const, width: 10, color: (pal: Parameters<NonNullable<FrontExercise['props']>>[0]) => pal.metal, at: (J: FrontJoints): [Vec2, Vec2] => [[SIGN[s] * 128, 193], frontGripAt(J, s)] }); const handle = (s: FSide) => ({ nm: `${s === 'l' ? 'Left' : 'Right'} ${grip} machine handle`, kind: 'rigid' as const, z: 'front' as const, shapes: (pal: Parameters<NonNullable<FrontExercise['props']>>[0]) => [{ kind: 'box' as const, nm: 'grip', color: pal.padFar, c: [0, 0] as Vec2, s: grip === 'neutral' ? [10, 28] as Vec2 : [28, 10] as Vec2, r: 5 }], at: (J: FrontJoints) => ({ p: frontGripAt(J, s), a: 0 }) }); return [lever('l'), lever('r'), handle('l'), handle('r')]; }
export function machineReverseFly(c: Common, o: { grip?: MachineGrip; row?: boolean; equipment?: 'machine' | 'smith' } = {}): FrontExercise { const grip = o.grip ?? 'overhand'; const row = o.row ?? false; return { id: c.id, name: c.name, view: 'front', tl: flyTL, meta: { en: c.en, family: 'rear-delt', equipment: [o.equipment ?? 'machine'], sources: c.sources }, muscles: [{ m: 'delts' }, { m: 'traps', scale: 0.45 }, { m: 'upperBack', scale: 0.55, region: { view: 'front', part: 'traps', c: [13, 2], s: [14, 8], r: 20, mirror: true } }, ...(row ? [{ m: 'biceps' as const, side: 'both' as const, scale: 0.45 }] : [])], props: machineProps, propsBox: [-160, 160], dynamic: machineParts(grip), pose: (t) => { const p = flyTL.at(t).p; return { ...machineBase(), arms: { l: { target: (J: FrontJoints) => machineTarget('l', p, J, row) }, r: { target: (J: FrontJoints) => machineTarget('r', p, J, row) } } }; } }; }

/** Sled reverse fly must put the athlete behind a taut rope, rather than standing on the sled. */
export function sledReverseFly(c: Common): FrontExercise { const tallBase = (): BasePose => ({ pelvis: [0, BODY.ankleH + 183, 0], hips: { pitch: 2 }, spine: { pitch: -1 }, head: { pitch: -2, yaw: 180 }, legs: { l: { target: [28, BODY.ankleH, 4] }, r: { target: [-28, BODY.ankleH, -2] } } }); const handle = (s: FSide, p: number, J: FrontJoints): Vec3 => { const low: Vec3 = [SIGN[s] * 18, -91, 46], high: Vec3 = [SIGN[s] * 108, -18, 34]; return add3(J[`shoulder_${s}`], mul3(norm3([lerp(low[0], high[0], p), lerp(low[1], high[1], p), lerp(low[2], high[2], p)]), REACH)); }; return { id: c.id, name: c.name, view: 'front', tl: flyTL, meta: { en: c.en, family: 'rear-delt', equipment: ['sled', 'rope'], sources: c.sources }, muscles: [{ m: 'delts' }, { m: 'traps', scale: 0.35 }, { m: 'upperBack', scale: 0.35, region: { view: 'front', part: 'traps', c: [13, 2], s: [13, 7], mirror: true } }], props: (pal) => ({ back: [{ kind: 'box', nm: 'sled-base', color: pal.metalDark, c: [0, 390], s: [164, 28], r: 5 }, { kind: 'box', nm: 'sled-upright', color: pal.metal, c: [0, 360], s: [126, 32], r: 5 }, { kind: 'box', nm: 'sled-load', color: pal.plate, c: [0, 337], s: [84, 16], r: 3 }] }), propsBox: [-98, 98], dynamic: (['l', 'r'] as FSide[]).flatMap((s) => [{ nm: `${s === 'l' ? 'Left' : 'Right'} sled rope`, kind: 'line' as const, z: 'back' as const, width: 3.2, color: (pal: Parameters<NonNullable<FrontExercise['props']>>[0]) => pal.cable, at: (J: FrontJoints): [Vec2, Vec2] => [[SIGN[s] * 52, 350], frontGripAt(J, s)] }, { nm: `${s === 'l' ? 'Left' : 'Right'} sled handle`, kind: 'rigid' as const, z: 'front' as const, shapes: (pal: Parameters<NonNullable<FrontExercise['props']>>[0]) => [{ kind: 'box' as const, nm: 'rope-grip', color: pal.padFar, c: [0, 0] as Vec2, s: [22, 9] as Vec2, r: 4.5 }], at: (J: FrontJoints) => ({ p: frontGripAt(J, s), a: 0 }) }]), pose: (t) => { const p = flyTL.at(t).p; return { ...tallBase(), arms: { l: { target: (J: FrontJoints) => handle('l', p, J) }, r: { target: (J: FrontJoints) => handle('r', p, J) } } }; } }; }
