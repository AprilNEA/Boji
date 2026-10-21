// Private builders for forearm-grip-2. Wrist curls keep the elbow and forearm still on the stated support.
// The load follows the closed hand through wrist flexion or extension. Source records that instead specify elbow flexion
// use supported curls, so the displayed movement follows the instructions rather than the draft exercise name.
import type { LibraryMeta, MovingPart, SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import type { Palette } from '@/draw/palettes.ts';
import type { Joints, LimbPair, Pose } from '@/rig/side.ts';
import { A, G, standLegs } from '@/exercises/common.ts';
import {
  barbell, cableColumn, cableHandle, cableLine, dumbbell, flatBench, gripAt, heldPlate, preacherBench,
  smithRails, towardCable, workTL,
} from '@/exercises/equipment/index.ts';

const TL = workTL(0.45);
const SEAT_BENCH = flatBench({ view: 'side', x: 225, top: 96 });
const SUPPORT_BENCH = flatBench({ view: 'side', x: 312, top: 165, length: 210 });
const STANDING_SUPPORT_BENCH = flatBench({ view: 'side', x: 350, top: 205, length: 200 });
const SEAT_HIP: Vec2 = [218, G - 116];
const SEAT_LEGS: LimbPair = {
  near: { target: [318, G - A], foot: 0, side: [0, -1] },
  far: { target: [312, G - A], foot: 0, side: [0, -1] },
};

type Basic = { id: string; name: string; en: string; sources: string[] };
type WristSpec = Basic & { reverse: boolean; unilateral?: boolean };

const wristHand = (reverse: boolean, p: number): number => reverse ? lerp(104, 48, p) : lerp(28, 84, p);
const meta = (c: Basic, equipment: LibraryMeta['equipment']): LibraryMeta => ({
  en: c.en, family: 'forearm-grip', equipment, sources: c.sources,
});

function seatedWristPose(p: number, reverse: boolean, unilateral = false): Pose {
  const hand = wristHand(reverse, p);
  return {
    hip: SEAT_HIP,
    // The modest forward lean puts the forearms along the upper thighs, with wrists just beyond the knees.
    spine: { lumbar: -72, thoracic: -72 }, neck: -73, head: -75,
    legs: SEAT_LEGS,
    arms: {
      near: { a1: 58, a2: 38, hand },
      far: unilateral ? { a1: 92, a2: 80, hand: 80 } : { a1: 58, a2: 38, hand },
    },
  };
}

function kneelingBenchWristPose(p: number, reverse: boolean, unilateral = false): Pose {
  const hand = wristHand(reverse, p);
  return {
    hip: [192, G - 116], spine: { lumbar: -64, thoracic: -64 }, neck: -66, head: -67,
    // Both knees stay on the floor. The raised pad carries the horizontal forearms.
    legs: {
      near: { a1: 70, a2: 174, foot: 180 },
      far: { a1: 70, a2: 174, foot: 180 },
    },
    arms: {
      near: { a1: 90, a2: 0, hand },
      far: unilateral ? { a1: 94, a2: 85, hand: 85 } : { a1: 90, a2: 0, hand },
    },
  };
}

const dumbbells = (unilateral: boolean, view: 'end' | 'profile' = 'end'): MovingPart<Joints>[] =>
  unilateral ? [dumbbell('n', view)] : [dumbbell('f', view), dumbbell('n', view)];

/** Seated or kneeling wrist curl. Both elbow joints and both forearm directions are fixed throughout. */
export function dumbbellWristCurl(c: WristSpec & { support: 'thigh' | 'bench' }): SideExercise {
  const bench = c.support === 'bench' ? SUPPORT_BENCH : SEAT_BENCH;
  const pose = c.support === 'bench' ? kneelingBenchWristPose : seatedWristPose;
  return {
    id: c.id, name: c.name, tl: TL,
    meta: meta(c, ['dumbbell', 'bench']),
    muscles: [{ m: 'forearms', side: c.unilateral ? 'near' : 'both' }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: dumbbells(c.unilateral ?? false),
    pose: (t) => pose(TL.at(t).p, c.reverse, c.unilateral),
  };
}

/** Finger curl: the forearm stays against the thigh while the dumbbell rolls out toward the fingertips, then closes. */
export function dumbbellFingerCurl(c: Basic): SideExercise {
  return {
    id: c.id, name: c.name, tl: TL,
    meta: meta(c, ['dumbbell', 'bench']),
    muscles: [{ m: 'forearms', side: 'near' }],
    props: (pal) => ({ back: SEAT_BENCH.draw(pal) }), propsBox: SEAT_BENCH.box,
    dynamic: [{
      ...dumbbell('n', 'end'),
      // The wrist stays neutral. The handle rolls from the fingertips into the palm as the fingers close.
      at: (J, t) => ({ p: add(J.wrist_n, mul(dir(J.hand_n.a), lerp(16, 9, TL.at(t).p))), a: 0 }),
    }],
    pose: (t) => {
      // The elbow, forearm, and wrist remain still; finger motion is represented by the load rolling along the hand.
      return seatedWristPose(0, false, true);
    },
  };
}

function seatedCurlPose(p: number, neutral: boolean, preacher: boolean): Pose {
  const upper = preacher ? 48 : 91;
  const low = preacher ? 62 : 86;
  const high = preacher ? -91 : -48;
  const fore = lerp(low, high, p);
  const hand = neutral ? fore - 90 : fore;
  return {
    hip: preacher ? [192, G - 103] : [225, G - 103],
    spine: preacher ? { lumbar: -75, thoracic: -78 } : { lumbar: -91, thoracic: -93 },
    neck: preacher ? -76 : -89, head: preacher ? -78 : -90,
    legs: { near: { a1: 0, a2: 90, foot: 0 }, far: { a1: 0, a2: 90, foot: 0 } },
    arms: {
      near: { a1: upper, a2: fore, hand },
      far: { a1: upper + 2, a2: fore + 2, hand: hand + 2 },
    },
  };
}

/** A source-record curl to shoulder height. The upper arms stay fixed, and the elbow closes from about 165° to 45°. */
export function sourceDumbbellCurl(c: Basic & { neutral: boolean; preacher?: boolean; unilateral?: boolean }): SideExercise {
  const preacher = c.preacher ?? false;
  const bench = preacher ? preacherBench({ x: 226, y: 235, angle: 45, seatX: 192 }) : SEAT_BENCH;
  return {
    id: c.id, name: c.name, tl: TL,
    meta: meta(c, ['dumbbell', 'bench']),
    muscles: [{ m: 'biceps', side: c.unilateral ? 'near' : 'both' }, { m: 'forearms', side: c.unilateral ? 'near' : 'both', scale: 0.45 }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: dumbbells(c.unilateral ?? false, c.neutral ? 'profile' : 'end'),
    pose: (t) => {
      const p = TL.at(t).p;
      const full = seatedCurlPose(p, c.neutral, preacher);
      if (!c.unilateral) return full;
      return { ...full, arms: { ...full.arms, far: { a1: 94, a2: 80, hand: 80 } } };
    },
  };
}

const CABLE = cableColumn({ x: 395, pulleyY: G - 38, toward: -1 });

function standingCablePose(p: number): Pose {
  const hand = wristHand(true, p);
  return {
    hip: [248, G - A - 183], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: standLegs(248, 0),
    // The elbows stay beside the rib cage while the straight-ish forearms face the low pulley.
    arms: { near: { a1: 76, a2: 80, hand }, far: { a1: 76, a2: 80, hand } },
  };
}

/** Low-cable reverse wrist curl. The cable stays attached to the closed hand while only the wrist rolls. */
export function cableStandingReverseWristCurl(c: Basic): SideExercise {
  const cableGrip = (J: Joints) => gripAt(J, 'n');
  return {
    id: c.id, name: c.name, tl: TL,
    meta: meta(c, ['cable']), muscles: [{ m: 'forearms', side: 'both' }],
    props: (pal) => ({ back: CABLE.draw(pal) }), propsBox: [220, CABLE.box[1]],
    dynamic: [
      cableLine(CABLE.pulley, cableGrip, 'Low cable'),
      cableHandle('end', (J) => { const p = cableGrip(J); return { p, a: towardCable(p, CABLE.pulley) }; }),
    ],
    pose: (t) => standingCablePose(TL.at(t).p),
  };
}

function standingBenchCablePose(p: number): Pose {
  const hand = wristHand(false, p);
  return {
    // A soft knee bend preserves ground contact without pushing the far leg past its reachable length.
    hip: [205, G - A - 180], spine: { lumbar: -55, thoracic: -55 }, neck: -55, head: -55,
    legs: standLegs(205, 0),
    // Elbows remain on the high flat bench; the forearms point along the pad toward the machine.
    arms: { near: { a1: 72, a2: 4, hand }, far: { a1: 72, a2: 4, hand } },
  };
}

/** Standing low-cable wrist curl. The pad fixes the forearms and the underhand grip rotates at the wrist. */
export function cableBenchWristCurl(c: Basic): SideExercise {
  const cableGrip = (J: Joints) => gripAt(J, 'n');
  return {
    id: c.id, name: c.name, tl: TL,
    meta: meta(c, ['cable', 'bench']), muscles: [{ m: 'forearms', side: 'both' }],
    props: (pal) => ({ back: [...STANDING_SUPPORT_BENCH.draw(pal), ...CABLE.draw(pal)] }),
    propsBox: [STANDING_SUPPORT_BENCH.box[0], CABLE.box[1]],
    dynamic: [
      cableLine(CABLE.pulley, cableGrip, 'Low cable'),
      cableHandle('end', (J) => { const p = cableGrip(J); return { p, a: towardCable(p, CABLE.pulley) }; }),
    ],
    pose: (t) => standingBenchCablePose(TL.at(t).p),
  };
}

/** Standing plate finger curl. The plates descend as the fingers extend and return as the hand closes. */
export function plateFingerCurl(c: Basic): SideExercise {
  const plate = (side: 'n' | 'f', dx: number) => heldPlate<Joints>(
    (J, t) => ({ p: add(gripAt(J, side), [dx, 14 * (1 - TL.at(t).p)]), a: 0 }),
    'face', 'medium', side === 'n' ? 'front' : 'overFarArm', `${side === 'n' ? 'Near' : 'Far'} Plate`,
  );
  return {
    id: c.id, name: c.name, tl: TL,
    meta: meta(c, ['plate']), muscles: [{ m: 'forearms', side: 'both' }],
    dynamic: [plate('f', -4), plate('n', 4)],
    pose: () => ({
      hip: [248, G - A - 183], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
      legs: standLegs(248, 0),
      arms: { near: { a1: 91, a2: 90, hand: 90 }, far: { a1: 91, a2: 90, hand: 90 } },
    }),
  };
}

/** Wrist roller. The fixed horizontal arms support the roller while the weighted rope winds up and down. */
export function wristRoller(c: Basic): SideExercise {
  const roller: MovingPart<Joints> = {
    nm: 'Wrist Roller', kind: 'rigid', z: 'underNearArm',
    shapes: (pal) => [
      { kind: 'oval', nm: 'roller-end', color: pal.metalDark, c: [0, 0], s: [25, 25] },
      { kind: 'oval', nm: 'roller-grip', color: pal.metal, c: [0, 0], s: [15, 15] },
      { kind: 'box', nm: 'roller-axis', color: pal.metal, c: [0, 0], s: [9, 28], r: 4 },
    ],
    at: (J, t) => ({ p: gripAt(J, 'n'), a: 360 * TL.at(t).p }),
  };
  const rope: MovingPart<Joints> = {
    nm: 'Weighted rope', kind: 'line' as const, z: 'front' as const, width: 3,
    color: (pal: Palette) => pal.cable,
    at: (J: Joints, t: number): [Vec2, Vec2] => {
      const top = gripAt(J, 'n');
      return [top, [top[0], top[1] + lerp(72, 170, 1 - TL.at(t).p)]];
    },
  };
  const weight = heldPlate<Joints>((J, t) => {
    const top = gripAt(J, 'n');
    return { p: [top[0], top[1] + lerp(72, 170, 1 - TL.at(t).p)], a: 0 };
  }, 'face', 'small', 'front', 'Roller weight');
  return {
    id: c.id, name: c.name, tl: TL,
    meta: meta(c, ['other', 'rope']), muscles: [{ m: 'forearms', side: 'both' }, { m: 'delts', side: 'both', scale: 0.35 }],
    dynamic: [rope, roller, weight],
    pose: () => ({
      hip: [230, G - A - 183], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
      legs: standLegs(230, 0),
      // Both elbows lock softly with the arms parallel to the floor in front of the shoulders.
      arms: { near: { a1: 0, a2: 0, hand: 0 }, far: { a1: 0, a2: 0, hand: 0 } },
    }),
  };
}

/** Seated leverage grip machine. Handles close together while the back and both feet remain fixed. */
export function machineGripSqueeze(c: Basic): SideExercise {
  const handle = (side: 'n' | 'f'): MovingPart<Joints> => ({
    nm: `${side === 'n' ? 'Near' : 'Far'} grip handle`, kind: 'rigid', z: side === 'n' ? 'underNearArm' : 'overFarArm',
    shapes: (pal) => [
      { kind: 'box', nm: 'grip', color: pal.pad, c: [0, 0], s: [13, 42], r: 6 },
      { kind: 'box', nm: 'lever', color: pal.metal, c: [0, 28], s: [8, 28], r: 3 },
    ],
    at: (J, t) => ({ p: add(gripAt(J, side), [0, 12 * (1 - TL.at(t).p)]), a: 0 }),
  });
  return {
    id: c.id, name: c.name, tl: TL,
    meta: meta(c, ['machine']), muscles: [{ m: 'forearms', side: 'both' }, { m: 'biceps', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [
      ...SEAT_BENCH.draw(pal),
      { kind: 'box', nm: 'machine-upright', color: pal.prop, c: [340, 312], s: [20, 270], r: 4 },
      { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [302, G - 4], s: [126, 8], r: 3 },
      { kind: 'box', nm: 'machine-chest-pad', color: pal.pad, c: [298, 250], s: [20, 96], r: 7 },
      { kind: 'box', nm: 'machine-crossbar', color: pal.metalDark, c: [319, 273], s: [54, 9], r: 4 },
    ] }),
    propsBox: [100, 350], dynamic: [handle('f'), handle('n')],
    pose: () => ({
      hip: [218, G - 103], spine: { lumbar: -91, thoracic: -93 }, neck: -89, head: -90,
      legs: { near: { a1: 0, a2: 90, foot: 0 }, far: { a1: 0, a2: 90, foot: 0 } },
      arms: { near: { a1: 38, a2: 12, hand: 90 }, far: { a1: 38, a2: 12, hand: 90 } },
    }),
  };
}

const SMITH = smithRails({ view: 'side', x: 343 });
const SMITH_BEHIND = smithRails({ view: 'side', x: 228 });

function smithStandingPose(p: number): Pose {
  const hand = wristHand(false, p);
  return {
    hip: [248, G - A - 183], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: standLegs(248, 0),
    arms: { near: { a1: 76, a2: 80, hand }, far: { a1: 76, a2: 80, hand } },
  };
}

/** Smith behind-the-back wrist curl. The rails and bar stay behind the hips while the wrists flex. */
export function smithBehindBackWristCurl(c: Basic): SideExercise {
  const pose = (p: number): Pose => ({
    hip: [248, G - A - 183], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: standLegs(248, 0),
    // The elbows stay just behind the torso. The Smith bar remains close behind the upper thighs.
    arms: { near: { a1: 108, a2: 90, hand: wristHand(true, p) }, far: { a1: 108, a2: 90, hand: wristHand(true, p) } },
  });
  return {
    id: c.id, name: c.name, tl: TL,
    meta: meta(c, ['smith']), muscles: [{ m: 'forearms', side: 'both' }],
    props: (pal) => ({ back: SMITH_BEHIND.draw(pal) }), propsBox: [SMITH_BEHIND.box[0], 300],
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => pose(TL.at(t).p),
  };
}

/** Smith seated wrist curl. The forearms stay on the thighs and only the supinated hands close toward them. */
export function smithSeatedWristCurl(c: Basic): SideExercise {
  return {
    id: c.id, name: c.name, tl: TL,
    meta: meta(c, ['smith', 'bench']), muscles: [{ m: 'forearms', side: 'both' }],
    props: (pal) => ({ back: [...SEAT_BENCH.draw(pal), ...SMITH.draw(pal)] }), propsBox: [SEAT_BENCH.box[0], SMITH.box[1]],
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => seatedWristPose(TL.at(t).p, false),
  };
}
