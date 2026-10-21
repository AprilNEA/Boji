// Private builders for the shrug-upright-row work list. Standing front-view poses keep both feet planted and the
// trunk tall. Shrugs move only the shoulder joints with nearly straight elbows; upright rows lead with outward,
// high elbows while the hands rise close to the torso.
import type { EquipmentTag, FrontExercise, MuscleSpec, PropShape, Props, SideExercise } from '@/exercise.ts';
import type { Palette } from '@/draw/palettes.ts';
import { lerp, type Vec2 } from '@/math/vec2.ts';
import { add3, type Vec3 } from '@/math/vec3.ts';
import { type FSide, type FrontJoints, type FrontPose } from '@/rig/front.ts';
import { BODY, type Pose } from '@/rig/side.ts';
import { A, G } from '@/exercises/common.ts';
import { bandCurve, barbell, cableColumn, cableHandle, cableLine, declineBench, dumbbell, frontDumbbell, frontGripAt, inclineBench, smithRails, workTL } from '@/exercises/equipment/index.ts';

const SIGN: Record<FSide, number> = { l: 1, r: -1 };
const STANDING_PELVIS: Vec3 = [0, BODY.ankleH + 183.3, 0];

function standingLegs(): FrontPose['legs'] {
  return {
    l: { target: [34, BODY.ankleH, 2] },
    r: { target: [-34, BODY.ankleH, 2] },
  };
}

function shrugArm(side: FSide): FrontPose['arms'][FSide] {
  const sign = SIGN[side];
  return {
    // The wrist stays one almost-straight arm length below its own shoulder.
    target: (J) => add3(J[`shoulder_${side}`], [sign * 10, -120, 3]),
    // `pole` is an IK direction, not a point. Point the elbows gently outward.
    pole: [sign, 0, 0],
    dir: [0, 0, 1],
  };
}

function rowArm(side: FSide, p: number, halfGrip: number, topRise?: number): FrontPose['arms'][FSide] {
  const sign = SIGN[side];
  // A wider grip needs a slightly higher hand target to keep its outward elbow at shoulder height.
  const rise = topRise ?? (halfGrip > 50 ? 49 : 31);
  return {
    // Bottom is at the upper thigh. At the top the hands approach the chin and the elbows sit above the wrists.
    // The motion stays in the frontal plane. A depth offset makes the elbow appear to travel behind the torso.
    target: (J) => [sign * halfGrip, J[`shoulder_${side}`][1] + lerp(-119, rise, p), 0],
    // `pole` is an IK direction, so this keeps each elbow on its own outward side of the torso.
    pole: [sign, 0, 0],
    dir: [0, 0, 1],
  };
}

function midpoint(a: readonly number[], b: readonly number[]): [number, number] {
  return [(a[0]! + b[0]!) / 2, (a[1]! + b[1]!) / 2];
}

export interface FrontShrugSpec {
  id: string;
  name: string;
  en: string;
  equipment: EquipmentTag[];
  sources: string[];
  implement: 'bodyweight' | 'band' | 'barbell' | 'dumbbell';
  behind?: boolean;
}

/** Tall standing shrug. The shoulder elevation carries the straight-arm implement upward without torso sway. */
export function frontShrug({ id, name, en, equipment, sources, implement, behind = false }: FrontShrugSpec): FrontExercise {
  const tl = workTL(0.45);
  return {
    id, name, view: 'front', tl,
    meta: { en, family: 'shrug-upright-row', equipment, sources },
    muscles: [{ m: 'traps' }, { m: 'delts', scale: 0.35 }],
    dynamic: implement === 'barbell'
      ? [barbell<FrontJoints>({
        view: 'front', plate: 'medium', z: behind ? 'back' : 'underNearArm',
        at: (J) => ({ p: midpoint(frontGripAt(J, 'l'), frontGripAt(J, 'r')) }),
      })]
      : implement === 'band'
        ? [bandCurve<FrontJoints>((J) => [
          frontGripAt(J, 'l'), [34, G - 4], [-34, G - 4], frontGripAt(J, 'r'),
        ])]
        : implement === 'dumbbell'
          ? [frontDumbbell('l', 'end'), frontDumbbell('r', 'end')]
        : [],
    pose(t) {
      const p = tl.at(t).p;
      return {
        pelvis: STANDING_PELVIS,
        legs: standingLegs(),
        shoulders: { l: { up: 15 * p }, r: { up: 15 * p } },
        arms: { l: shrugArm('l'), r: shrugArm('r') },
      };
    },
  };
}

export interface FrontRowSpec {
  id: string;
  name: string;
  en: string;
  equipment: EquipmentTag[];
  sources: string[];
  implement: 'band' | 'barbell' | 'dumbbell';
  wide?: boolean;
}

/** Upright row with an unchanged torso. The hands track close to the body and the elbows lead above them. */
export function frontUprightRow({ id, name, en, equipment, sources, implement, wide = false }: FrontRowSpec): FrontExercise {
  const tl = workTL(0.5);
  const halfGrip = wide ? 70 : 42;
  const muscles: MuscleSpec[] = [{ m: 'delts' }, { m: 'traps', scale: 0.55 }, { m: 'biceps', side: 'both', scale: 0.3 }];
  return {
    id, name, view: 'front', tl,
    meta: { en, family: 'shrug-upright-row', equipment, sources },
    muscles,
    dynamic: implement === 'barbell'
      ? [barbell<FrontJoints>({
        view: 'front', plate: 'medium',
        at: (J) => ({ p: midpoint(frontGripAt(J, 'l'), frontGripAt(J, 'r')) }),
      })]
      : implement === 'band'
        ? [bandCurve<FrontJoints>((J) => [
          frontGripAt(J, 'l'), [34, G - 4], [-34, G - 4], frontGripAt(J, 'r'),
        ])]
        : [frontDumbbell('l', 'end'), frontDumbbell('r', 'end')],
    pose(t) {
      const p = tl.at(t).p;
      return {
        pelvis: STANDING_PELVIS,
        legs: standingLegs(),
        arms: { l: rowArm('l', p, halfGrip), r: rowArm('r', p, halfGrip) },
      };
    },
  };
}

/** Exposed for variations that add cable or dumbbell equipment to the same verified standing row geometry. */
export function frontRowPose(p: number, halfGrip: number): FrontPose {
  return {
    pelvis: STANDING_PELVIS,
    legs: standingLegs(),
    arms: { l: rowArm('l', p, halfGrip), r: rowArm('r', p, halfGrip) },
  };
}

/** Exposed for variations that add a different shoulder-loaded apparatus to the standing shrug geometry. */
export function frontShrugPose(p: number): FrontPose {
  return {
    pelvis: STANDING_PELVIS,
    legs: standingLegs(),
    shoulders: { l: { up: 15 * p }, r: { up: 15 * p } },
    arms: { l: shrugArm('l'), r: shrugArm('r') },
  };
}

/** A single dumbbell row alternates sides. Each active arm completes the source movement before the other side starts. */
export function frontSingleDumbbellUprightRow({ id, name, en, sources }: {
  id: string; name: string; en: string; sources: string[];
}): FrontExercise {
  const oneSide = workTL(0.45);
  const activeSide = (t: number): FSide => (t < 0.5 ? 'l' : 'r');
  return {
    id, name, view: 'front',
    // Both sides use one controlled repetition. The individual action timing remains 3.5 s.
    tl: { total: oneSide.total * 2, at: (t) => oneSide.at((t * 2) % 1) },
    meta: { en, family: 'shrug-upright-row', equipment: ['dumbbell'], sources },
    muscles: [{ m: 'delts', side: 'l' }, { m: 'delts', side: 'r' }, { m: 'traps', scale: 0.5 }, { m: 'biceps', scale: 0.3 }],
    // One end-on dumbbell follows the working hand. The brief hand change occurs only after the load has returned
    // to the thigh, between the two source-defined repetitions.
    dynamic: [{
      nm: 'Single Dumbbell', z: 'front', kind: 'rigid',
      shapes: (pal) => [
        { kind: 'oval', nm: 'plate', color: pal.plate, c: [0, 0], s: [28, 28] },
        { kind: 'oval', nm: 'plate-face', color: pal.metalDark, c: [0, 0], s: [19, 19] },
        { kind: 'oval', nm: 'hub', color: pal.metal, c: [0, 0], s: [8, 8] },
      ],
      at: (J, t) => ({ p: frontGripAt(J, activeSide(t)) }),
    }],
    pose(t) {
      const side = activeSide(t);
      const p = oneSide.at((t * 2) % 1).p;
      return {
        pelvis: STANDING_PELVIS,
        legs: standingLegs(),
        arms: {
          l: side === 'l' ? rowArm('l', p, 25) : shrugArm('l'),
          r: side === 'r' ? rowArm('r', p, 25) : shrugArm('r'),
        },
      };
    },
  };
}

const SMITH = smithRails({ view: 'front', x: 0, top: 26, width: 350 });

/** Smith rails fix the bar path vertically. The standing shrug otherwise uses the same planted, tall posture. */
export function frontSmithShrug({ id, name, en, sources, behind = false }: { id: string; name: string; en: string; sources: string[]; behind?: boolean }): FrontExercise {
  const ex = frontShrug({ id, name, en, equipment: ['smith'], sources, implement: 'barbell', behind });
  return { ...ex, props: (pal) => ({ back: SMITH.draw(pal) }), propsBox: SMITH.box };
}

/** Wide snatch grip shrug. The hands stay far outside the shoulders while a small shoulder elevation moves the bar. */
export function frontSnatchGripShrug({ id, name, en, sources }: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const tl = workTL(0.45);
  const arm = (side: FSide): FrontPose['arms'][FSide] => {
    const sign = SIGN[side];
    return {
      target: (J) => add3(J[`shoulder_${side}`], [sign * 55, -110, 3]),
      pole: [sign, 0, 0], dir: [0, 0, 1],
    };
  };
  return {
    id, name, view: 'front', tl,
    meta: { en, family: 'shrug-upright-row', equipment: ['barbell'], sources },
    muscles: [{ m: 'traps' }, { m: 'delts', scale: 0.35 }, { m: 'forearms', side: 'both', scale: 0.3 }],
    dynamic: [barbell<FrontJoints>({
      view: 'front', plate: 'medium',
      at: (J) => ({ p: midpoint(frontGripAt(J, 'l'), frontGripAt(J, 'r')) }),
    })],
    pose(t) {
      const p = tl.at(t).p;
      return {
        pelvis: STANDING_PELVIS, legs: standingLegs(),
        shoulders: { l: { up: 15 * p }, r: { up: 15 * p } },
        arms: { l: arm('l'), r: arm('r') },
      };
    },
  };
}

/** Smith rails constrain the bilateral upright-row bar while the elbows lead in the frontal plane. */
export function frontSmithUprightRow({ id, name, en, sources }: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const ex = frontUprightRow({ id, name, en, equipment: ['smith'], sources, implement: 'barbell' });
  return { ...ex, props: (pal) => ({ back: SMITH.draw(pal) }), propsBox: SMITH.box };
}

/** One-arm Smith upright row. The bar stays centered on the rails; the working upper arm stops parallel to the floor. */
export function frontSingleSmithUprightRow({ id, name, en, sources }: {
  id: string; name: string; en: string; sources: string[];
}): FrontExercise {
  const oneSide = workTL(0.45);
  const activeSide = (t: number): FSide => (t < 0.5 ? 'l' : 'r');
  return {
    id, name, view: 'front',
    tl: { total: oneSide.total * 2, at: (t) => oneSide.at((t * 2) % 1) },
    meta: { en, family: 'shrug-upright-row', equipment: ['smith'], sources },
    muscles: [{ m: 'delts', side: 'l' }, { m: 'delts', side: 'r' }, { m: 'traps', scale: 0.45 }, { m: 'biceps', scale: 0.3 }],
    props: (pal) => ({ back: SMITH.draw(pal) }), propsBox: SMITH.box,
    dynamic: [barbell<FrontJoints>({
      view: 'front', plate: 'medium',
      // The rail line is fixed at the body midline. At rest, the operator changes hands before the other repetition.
      at: (J, t) => ({ p: [0, frontGripAt(J, activeSide(t))[1]] }),
    })],
    pose(t) {
      const side = activeSide(t);
      const p = oneSide.at((t * 2) % 1).p;
      return {
        pelvis: STANDING_PELVIS,
        legs: standingLegs(),
        arms: {
          // The source stops once the raised upper arm reaches parallel, rather than at the chin.
          l: side === 'l' ? rowArm('l', p, 63, -50) : shrugArm('l'),
          r: side === 'r' ? rowArm('r', p, 63, -50) : shrugArm('r'),
        },
      };
    },
  };
}

const CABLE = cableColumn({ x: -145, pulleyY: G - 38, toward: 1 });
function frontCableParts(row: boolean): FrontExercise['dynamic'] {
  return [
    cableLine<FrontJoints>(CABLE.pulley, (J) => {
      const a = frontGripAt(J, 'l'), b = frontGripAt(J, 'r');
      return midpoint(a, b);
    }),
    cableHandle<FrontJoints>('bar', (J) => ({
      p: midpoint(frontGripAt(J, 'l'), frontGripAt(J, 'r')),
      // The attachment remains level while moving close to the torso.
      a: 0,
    }), { len: row ? 92 : 112 }),
  ];
}

/** Low-pulley straight-bar shrug. The cable stays visibly connected as the elevated shoulders raise the straight arms. */
export function frontCableShrug({ id, name, en, sources }: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const ex = frontShrug({ id, name, en, equipment: ['cable'], sources, implement: 'bodyweight' });
  return { ...ex, props: (pal) => ({ back: CABLE.draw(pal) }), propsBox: CABLE.box, dynamic: frontCableParts(false) };
}

/** Low-pulley upright row. The guided attachment rises close to the torso with elbows higher than the forearms. */
export function frontCableUprightRow({ id, name, en, sources }: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const ex = frontUprightRow({ id, name, en, equipment: ['cable'], sources, implement: 'band' });
  return { ...ex, props: (pal) => ({ back: CABLE.draw(pal) }), propsBox: CABLE.box, dynamic: frontCableParts(true) };
}

function frontMachineProps(seated: boolean): (pal: Palette) => Props {
  return (pal) => {
    const seatY = G - 104;
    const back: PropShape[] = [
      { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [0, G - 4], s: [250, 8], r: 3 },
      { kind: 'box', nm: 'machine-post-left', color: pal.metalDark, c: [-104, (G - 286 + G) / 2], s: [14, 286], r: 4 },
      { kind: 'box', nm: 'machine-post-right', color: pal.metalDark, c: [104, (G - 286 + G) / 2], s: [14, 286], r: 4 },
      { kind: 'box', nm: 'machine-crossbar', color: pal.metal, c: [0, G - 286], s: [222, 14], r: 5 },
      ...(seated ? [
        { kind: 'box' as const, nm: 'backrest', color: pal.padFar, c: [0, seatY - 55], s: [78, 118], r: 10 },
        { kind: 'box' as const, nm: 'seat', color: pal.pad, c: [0, seatY], s: [104, 16], r: 8 },
        { kind: 'box' as const, nm: 'seat-post', color: pal.metalDark, c: [0, (seatY + G) / 2], s: [14, G - seatY], r: 4 },
      ] as PropShape[] : []),
    ];
    return { back };
  };
}

function machinePads(): FrontExercise['dynamic'] {
  return [{
    nm: 'Shoulder Pad Carriage', z: 'back', kind: 'rigid',
    shapes: (pal) => [
      { kind: 'box', nm: 'carriage', color: pal.metal, c: [0, -12], s: [126, 12], r: 5 },
      { kind: 'box', nm: 'left-pad', color: pal.pad, c: [44, 2], s: [52, 22], r: 9 },
      { kind: 'box', nm: 'right-pad', color: pal.pad, c: [-44, 2], s: [52, 22], r: 9 },
    ],
    at: (J) => ({ p: [(J.shoulder_l[0] + J.shoulder_r[0]) / 2, (G - J.shoulder_l[1] + G - J.shoulder_r[1]) / 2] }),
  }];
}

/** Shoulder-loaded standing machine shrug. Pads rest above both shoulders while feet and arms stay still. */
export function frontMachineStandingShrug({ id, name, en, sources }: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const ex = frontShrug({ id, name, en, equipment: ['machine'], sources, implement: 'bodyweight' });
  return { ...ex, props: frontMachineProps(false), propsBox: [-125, 125], dynamic: machinePads() };
}

/** Seated leverage shrug. The backrest and seat identify the seated machine while the pads load shoulder elevation. */
export function frontMachineSeatedShrug({ id, name, en, sources }: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const tl = workTL(0.45);
  return {
    id, name, view: 'front', tl,
    meta: { en, family: 'shrug-upright-row', equipment: ['machine'], sources },
    muscles: [{ m: 'traps' }, { m: 'delts', scale: 0.35 }],
    props: frontMachineProps(true), propsBox: [-125, 125], dynamic: machinePads(),
    pose(t) {
      const p = tl.at(t).p;
      return {
        pelvis: [0, BODY.ankleH + 102, 0],
        legs: { l: { target: [57, BODY.ankleH, 2] }, r: { target: [-57, BODY.ankleH, 2] } },
        shoulders: { l: { up: 15 * p }, r: { up: 15 * p } },
        arms: {
          l: { target: (J) => add3(J.shoulder_l, [55, -55, 0]), pole: [1, 0, 0], dir: [0, 0, 1] },
          r: { target: (J) => add3(J.shoulder_r, [-55, -55, 0]), pole: [-1, 0, 0], dir: [0, 0, 1] },
        },
      };
    },
  };
}

type BenchShrugKind = 'incline-prone' | 'decline-prone' | 'incline-seated';

/**
 * Bench-supported dumbbell shrugs. The torso rests against the selected pad and each arm stays straight.
 * A five-degree whole-arm sweep shows scapular elevation or retraction without falsely flexing the elbows.
 */
export function sideDumbbellBenchShrug({
  id, name, en, sources, kind,
}: { id: string; name: string; en: string; sources: string[]; kind: BenchShrugKind }): SideExercise {
  const tl = workTL(0.5);
  // This follows the verified chest-supported incline geometry: the sternum, rather than the back, rests on the pad.
  const incline = inclineBench({ x: 302, angle: 45, top: 108, facing: 1, back: 176, seat: 76 });
  // The pad is high enough that long, vertical arms and the dumbbells clear the floor at the lower head end.
  const decline = declineBench({ x: 112, angle: 20, low: 126, length: 230 });
  const isDecline = kind === 'decline-prone';
  const isSeated = kind === 'incline-seated';
  const fixedLegs: Pose['legs'] = isDecline
    ? {
        near: { target: [decline.roller[0] - 7, decline.roller[1] + 4], foot: -18, side: [0, -1] },
        far: { target: [decline.roller[0] - 12, decline.roller[1] + 5], foot: -18, side: [0, -1] },
      }
    : {
        near: { target: [356, G - A], foot: 0, side: [0, -1] },
        far: { target: [350, G - A], foot: 0, side: [0, -1] },
      };
  const base = (): Omit<Pose, 'arms'> => {
    if (isDecline) {
      return { hip: [218, 286], spine: { lumbar: 160, thoracic: 160 }, neck: 160, head: 160, legs: fixedLegs };
    }
    if (isSeated) {
      return { hip: [272, G - 104], spine: { lumbar: -135, thoracic: -135 }, neck: -135, head: -135, legs: fixedLegs };
    }
    return { hip: [282, G - 160], spine: { lumbar: -151, thoracic: -151 }, neck: -151, head: -151, legs: fixedLegs };
  };
  return {
    id, name, tl,
    meta: { en, family: 'shrug-upright-row', equipment: ['dumbbell', 'bench'], sources },
    muscles: [{ m: 'traps' }, { m: 'upperBack', scale: kind === 'incline-prone' ? 0.65 : 0.35 }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: (isDecline ? decline : incline).draw(pal) }),
    propsBox: (isDecline ? decline : incline).box,
    dynamic: [dumbbell('f', 'profile'), dumbbell('n', 'profile')],
    pose(t) {
      const p = tl.at(t).p;
      // The arms remain locked. The top position sweeps them only 5° toward the upper back.
      const a = isDecline ? 90 - 5 * p : 90 + 5 * p;
      return {
        ...base(),
        arms: {
          near: { a1: a, a2: a, hand: a },
          far: { a1: a, a2: a, hand: a },
        },
      };
    },
  };
}
