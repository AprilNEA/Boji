// Shared triceps-extension builders for this work list.
// The builders keep the torso and upper arms fixed while the elbow drives the implement.
// Cable lines end at the attachment, and benches or balls support every seated or supine pose.
import type { LibraryMeta, MovingPart, PropShape, SideExercise } from '@/exercise.ts';
import { add, lerp, mul, sub, timeline, type Vec2 } from '@/math.ts';
import type { Joints, Pose } from '@/rig.ts';
import { A, G, GRIP_IN_HAND, handOnHip, standLegs } from '@/exercises/common.ts';
import {
  cableColumn,
  cableHandle,
  cableLine,
  declineBench,
  dumbbell,
  flatBench,
  gripAt,
  inclineBench,
  stabilityBall,
  towardCable,
  handleEnd,
  workTL,
} from '@/exercises/equipment/index.ts';

type Meta = LibraryMeta;
type Attachment = 'rope' | 'bar' | 'vbar';
type DumbbellGrip = 'profile' | 'end';

const normalTL = workTL(0.3);
const alternatingTL = timeline([
  { d: 0.85, from: 0, to: 1, e: [0.35, 1] },
  { d: 0.2, from: 1, to: 1, e: [1, 0.88] },
  { d: 1.15, from: 1, to: 0, e: [0.85, 0.35] },
  { d: 0.85, from: 0, to: 1, e: [0.35, 1] },
  { d: 0.2, from: 1, to: 1, e: [1, 0.88] },
  { d: 1.15, from: 1, to: 0, e: [0.85, 0.35] },
]);

/** Full repetitions occur in separate halves of the alternating loop. */
const alternate = (t: number) => ({
  near: t < 0.5,
  p: normalTL.at((t < 0.5 ? t : t - 0.5) * 2).p,
});

const standingBase = (): Omit<Pose, 'arms'> => ({
  // A 1 px leg slack keeps knees soft without turning standing cable work into a squat.
  hip: [250, G - A - 183],
  spine: { lumbar: -86, thoracic: -86 }, neck: -86, head: -86,
  legs: standLegs(250, 0),
  farHip: 0,
});

/** A high-pulley pushdown: upper arms point down and only forearms open. */
export function cablePushdown(opts: {
  id: string; name: string; meta: Meta; attachment: Attachment; single?: boolean; armBlaster?: boolean;
}): SideExercise {
  const column = cableColumn({ x: 420, pulleyY: 78, toward: -1 });
  const arm = (p: number) => ({ a1: 90, a2: lerp(28, 90, p), hand: lerp(28, 90, p) });
  const attachmentAngle = (J: Joints): number => towardCable(gripAt(J, 'n'), column.pulley);
  const handleKind = opts.single ? 'd' : opts.attachment === 'bar' ? 'end' : opts.attachment;
  const blaster = (pal: Parameters<NonNullable<SideExercise['props']>>[0]): PropShape[] => opts.armBlaster ? [
    // A neck strap and a rigid elbow shelf distinguish the arm-blaster variation.
    { kind: 'poly' as const, nm: 'arm-blaster-strap', color: pal.metalDark, w: 5, pts: [[246, 152], [230, 180], [232, 217]] },
    { kind: 'box' as const, nm: 'arm-blaster-shelf', color: pal.metal, c: [248, 215], s: [36, 10], r: 5, rot: -8 },
  ] : [];
  return {
    id: opts.id, name: opts.name, tl: normalTL, meta: opts.meta,
    muscles: opts.single
      ? [{ m: 'triceps', side: 'near' }, { m: 'forearms', side: 'near', scale: 0.4 }]
      : [{ m: 'triceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.4 }],
    props: (pal) => ({ back: column.draw(pal), front: blaster(pal) }),
    propsBox: [195, column.box[1]],
    dynamic: [
      cableLine(column.pulley, (J) => handleEnd(gripAt(J, 'n'), attachmentAngle(J))),
      cableHandle(handleKind, (J) => ({ p: gripAt(J, 'n'), a: attachmentAngle(J) }), opts.attachment === 'rope' ? { spread: 14 } : { z: 'underNearArm' }),
    ],
    pose: (t) => {
      const p = normalTL.at(t).p;
      return {
        ...standingBase(),
        arms: opts.single
          ? { near: arm(p), far: handOnHip(-4) }
          : { near: arm(p), far: arm(p) },
      };
    },
  };
}

/** A low cable stays behind the head while a vertical upper arm extends at the elbow. */
export function cableOverheadExtension(opts: {
  id: string; name: string; meta: Meta; rope?: boolean; single?: boolean; incline?: boolean;
}): SideExercise {
  const column = cableColumn({ x: opts.incline ? 58 : 66, pulleyY: opts.incline ? 82 : 397, toward: 1 });
  const bench = opts.incline ? inclineBench({ x: 270, angle: 35, facing: 1 }) : undefined;
  const base: Omit<Pose, 'arms'> = opts.incline ? {
    // The torso follows the backrest. The arms remain vertical above the head, not perpendicular to the pad.
    hip: [279, 349], spine: { lumbar: -145, thoracic: -145 }, neck: -145, head: -145,
    legs: {
      near: { target: [360, G - A], foot: 0, side: [0, -1] },
      far: { target: [354, G - A], foot: 0, side: [0, -1] },
    },
  } : standingBase();
  // 270° is the same up direction as -90°, but preserves the long extension arc from the flexed position.
  const arm = (p: number) => ({ a1: -90, a2: lerp(145, 270, p), hand: lerp(145, 270, p) });
  const attachmentAngle = (J: Joints): number => towardCable(gripAt(J, 'n'), column.pulley);
  return {
    id: opts.id, name: opts.name, tl: normalTL, meta: opts.meta,
    muscles: opts.single
      ? [{ m: 'triceps', side: 'near' }, { m: 'delts', side: 'near', scale: 0.35 }]
      : [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: [...column.draw(pal), ...(bench?.draw(pal) ?? [])] }),
    propsBox: bench ? [column.box[0], bench.box[1]] : [column.box[0], 330],
    dynamic: [
      cableLine(column.pulley, (J) => handleEnd(gripAt(J, 'n'), attachmentAngle(J))),
      cableHandle(opts.single ? 'd' : opts.rope ? 'rope' : 'd', (J) => ({ p: gripAt(J, 'n'), a: attachmentAngle(J) }), opts.rope ? { spread: 14 } : {}),
    ],
    pose: (t) => {
      const p = normalTL.at(t).p;
      return {
        ...base,
        arms: opts.single
          ? {
            near: arm(p),
            // The free hand stabilizes the working elbow in the low-pulley one-arm variation.
            far: { target: (J) => add(J.elbow_n, [-5, 5]), side: [1, 0], hand: 0 },
          }
          : { near: arm(p), far: arm(p) },
      };
    },
  };
}

/** Bent-over cable kickback. The torso and upper arms stay fixed while the forearms sweep backward. */
export function cableKickback(opts: { id: string; name: string; meta: Meta; single?: boolean }): SideExercise {
  const column = cableColumn({ x: 412, pulleyY: 350, toward: -1 });
  const base: Omit<Pose, 'arms'> = {
    hip: [245, G - A - 183], spine: { lumbar: -45, thoracic: -45 }, neck: -45, head: -45,
    legs: standLegs(245, 0), farHip: 0,
  };
  const arm = (p: number) => ({ a1: 165, a2: lerp(75, 165, p), hand: lerp(75, 165, p) });
  const angle = (J: Joints, side: 'n' | 'f'): number => towardCable(gripAt(J, side), column.pulley);
  const working: MovingPart[] = opts.single
    ? [
      cableLine(column.pulley, (J) => handleEnd(gripAt(J, 'n'), angle(J, 'n'))),
      cableHandle('d', (J) => ({ p: gripAt(J, 'n'), a: angle(J, 'n') })),
    ]
    : [
      cableLine(column.pulley, (J) => handleEnd(gripAt(J, 'f'), angle(J, 'f')), 'Far cable'),
      cableLine(column.pulley, (J) => handleEnd(gripAt(J, 'n'), angle(J, 'n')), 'Near cable'),
      cableHandle('d', (J) => ({ p: gripAt(J, 'f'), a: angle(J, 'f') }), { z: 'overFarArm' }),
      cableHandle('d', (J) => ({ p: gripAt(J, 'n'), a: angle(J, 'n') })),
    ];
  return {
    id: opts.id, name: opts.name, tl: normalTL, meta: opts.meta,
    muscles: opts.single
      ? [{ m: 'triceps', side: 'near' }, { m: 'delts', side: 'near', scale: 0.35 }]
      : [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: column.draw(pal) }), propsBox: [185, column.box[1]], dynamic: working,
    pose: (t) => {
      const p = normalTL.at(t).p;
      return { ...base, arms: opts.single ? { near: arm(p), far: handOnHip(-3) } : { near: arm(p), far: arm(p) } };
    },
  };
}

interface LyingOptions {
  id: string; name: string; meta: Meta; cable?: boolean; floor?: boolean; decline?: boolean; incline?: boolean;
  alternating?: boolean; grip?: DumbbellGrip;
}

/** Supine skull-crusher pattern. Upper arms are vertical and elbows move from about 55° to straight. */
export function lyingTricepsExtension(opts: LyingOptions): SideExercise {
  const flat = !opts.floor && !opts.decline && !opts.incline ? flatBench({ view: 'side', x: 240 }) : undefined;
  const decline = opts.decline ? declineBench({ x: 115, angle: 20, low: 70, length: 220 }) : undefined;
  const incline = opts.incline ? inclineBench({ x: 270, angle: 35, facing: 1 }) : undefined;
  const cable = opts.cable ? cableColumn({ x: 46, pulleyY: opts.floor ? 398 : 390, toward: 1 }) : undefined;
  const base: Omit<Pose, 'arms'> = opts.floor ? {
    // Floor version: knees are bent and the head faces the low pulley behind it.
    hip: [280, 395], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    legs: {
      near: { target: [350, G - A], foot: 0, side: [0, -1] },
      far: { target: [344, G - A], foot: 0, side: [0, -1] },
    },
  } : opts.decline ? {
    hip: [254, 316], spine: { lumbar: 160, thoracic: 160 }, neck: 160, head: 160,
    legs: {
      near: { target: [335, 310], foot: 160, side: [0, 1] },
      far: { target: [331, 312], foot: 160, side: [0, 1] },
    },
  } : opts.incline ? {
    hip: [279, 349], spine: { lumbar: -145, thoracic: -145 }, neck: -145, head: -145,
    legs: {
      near: { target: [360, G - A], foot: 0, side: [0, -1] },
      far: { target: [354, G - A], foot: 0, side: [0, -1] },
    },
  } : {
    hip: [284, 342], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    legs: {
      near: { target: [365, G - A], foot: 0, side: [0, -1] },
      far: { target: [359, G - A], foot: 0, side: [0, -1] },
    },
  };
  const arm = (p: number) => ({ a1: -90, a2: lerp(155, 270, p), hand: lerp(155, 270, p) });
  const armSet = (t: number) => {
    if (!opts.alternating) {
      const p = normalTL.at(t).p;
      return { near: arm(p), far: arm(p) };
    }
    const { near, p } = alternate(t);
    return { near: arm(near ? p : 1), far: arm(near ? 1 : p) };
  };
  const attachmentAngle = (J: Joints): number => towardCable(gripAt(J, 'n'), cable!.pulley);
  const dynamic: MovingPart[] = opts.cable ? [
    cableLine(cable!.pulley, (J) => handleEnd(gripAt(J, 'n'), attachmentAngle(J))),
    cableHandle(opts.floor ? 'rope' : 'end', (J) => ({ p: gripAt(J, 'n'), a: attachmentAngle(J) }), opts.floor ? { spread: 14 } : {}),
  ] : [dumbbell('f', opts.grip ?? 'profile'), dumbbell('n', opts.grip ?? 'profile')];
  return {
    id: opts.id, name: opts.name, tl: opts.alternating ? alternatingTL : normalTL, meta: opts.meta,
    mat: opts.floor,
    muscles: opts.alternating
      ? [
        { m: 'triceps', side: 'near', e: (t) => alternate(t).near ? 1 : 0.2 },
        { m: 'triceps', side: 'far', e: (t) => alternate(t).near ? 0.2 : 1 },
        { m: 'delts', side: 'both', scale: 0.3 },
      ]
      : [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [...(cable?.draw(pal) ?? []), ...(flat?.draw(pal) ?? []), ...(decline?.draw(pal) ?? []), ...(incline?.draw(pal) ?? [])] }),
    propsBox: cable ? [cable.box[0], (flat ?? decline ?? incline)?.box[1] ?? 380] : (flat ?? decline ?? incline)?.box,
    dynamic,
    pose: (t) => ({ ...base, arms: armSet(t) }),
  };
}

interface KickbackOptions {
  id: string; name: string; meta: Meta; seated?: boolean; single?: boolean; alternating?: boolean; ball?: boolean;
}

/** Dumbbell kickback. The working upper arm stays parallel to the trunk while the elbow extends backward. */
export function dumbbellKickback(opts: KickbackOptions): SideExercise {
  const bench = opts.seated && !opts.ball ? flatBench({ view: 'side', x: 245, top: 84, length: 156 }) : undefined;
  const base: Omit<Pose, 'arms'> = opts.ball ? {
    hip: [235, 315], spine: { lumbar: -45, thoracic: -45 }, neck: -45, head: -45,
    legs: {
      near: { target: [282, G - A], foot: 0, side: [0, -1] },
      far: { target: [276, G - A], foot: 0, side: [0, -1] },
    },
  } : opts.seated ? {
    hip: [240, 348], spine: { lumbar: -25, thoracic: -25 }, neck: -25, head: -25,
    legs: {
      near: { target: [290, G - A], foot: 0, side: [0, -1] },
      far: { target: [284, G - A], foot: 0, side: [0, -1] },
    },
  } : {
    hip: [245, G - A - 183], spine: { lumbar: -45, thoracic: -45 }, neck: -45, head: -45,
    legs: standLegs(245, 0), farHip: 0,
  };
  const arm = (p: number) => ({ a1: 165, a2: lerp(75, 165, p), hand: lerp(75, 165, p) });
  const armSet = (t: number) => {
    if (!opts.alternating) {
      const p = normalTL.at(t).p;
      return opts.single ? { near: arm(p), far: handOnHip(-3) } : { near: arm(p), far: arm(p) };
    }
    const { near, p } = alternate(t);
    return { near: arm(near ? p : 1), far: arm(near ? 1 : p) };
  };
  return {
    id: opts.id, name: opts.name, tl: opts.alternating ? alternatingTL : normalTL, meta: opts.meta,
    muscles: opts.alternating
      ? [
        { m: 'triceps', side: 'near', e: (t) => alternate(t).near ? 1 : 0.2 },
        { m: 'triceps', side: 'far', e: (t) => alternate(t).near ? 0.2 : 1 },
        { m: 'delts', side: 'both', scale: 0.35 },
      ]
      : opts.single
        ? [{ m: 'triceps', side: 'near' }, { m: 'delts', side: 'near', scale: 0.35 }]
        : [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: bench?.draw(pal) ?? [] }), propsBox: bench?.box,
    dynamic: [
      ...(opts.ball ? [stabilityBall(() => ({ p: [225, G - 68] }))] : []),
      ...(opts.single ? [dumbbell('n', 'profile')] : [dumbbell('f', 'profile'), dumbbell('n', 'profile')]),
    ],
    pose: (t) => ({ ...base, arms: armSet(t) }),
  };
}

/** Seated overhead dumbbell extension with the arms beside the ears and a supported upright torso. */
export function seatedOverheadExtension(opts: {
  id: string; name: string; meta: Meta; single?: boolean; grip?: DumbbellGrip;
}): SideExercise {
  const bench = inclineBench({ x: 242, angle: 82, facing: 1, back: 150, seat: 78 });
  const base: Omit<Pose, 'arms'> = {
    hip: [246, G - 100], spine: { lumbar: -94, thoracic: -96 }, neck: -92, head: -90,
    legs: {
      near: { target: [340, G - A], foot: 0, side: [0, -1] },
      far: { target: [334, G - A], foot: 0, side: [0, -1] },
    },
  };
  const arm = (p: number) => ({ a1: -90, a2: lerp(145, 270, p), hand: lerp(145, 270, p) });
  return {
    id: opts.id, name: opts.name, tl: normalTL, meta: opts.meta,
    muscles: opts.single
      ? [{ m: 'triceps', side: 'near' }, { m: 'delts', side: 'near', scale: 0.35 }]
      : [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [dumbbell('n', opts.grip ?? 'profile')],
    pose: (t) => {
      const p = normalTL.at(t).p;
      return { ...base, arms: opts.single ? { near: arm(p), far: handOnHip(-3) } : { near: arm(p), far: arm(p) } };
    },
  };
}
