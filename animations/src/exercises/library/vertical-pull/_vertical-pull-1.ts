// Shared builders for the vertical-pull-1 catalog. Fixed grips and supports use IK targets.
// The builders distinguish seated and standing pulls, high anchors, wide bars, bands, and assisted supports.
// Each wrapper supplies the exact display name, visible equipment, and source records.
import type { FrontExercise, LibraryMeta, Props, SideExercise } from '@/exercise.ts';
import { add, lerp, lerpV, sub, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline } from '@/math/timeline.ts';
import { add3, type Vec3 } from '@/math/vec3.ts';
import { BODY, solve, type Joints, type LimbPair, type Pose } from '@/rig/side.ts';
import { FB, project, type FrontJoints } from '@/rig/front.ts';
import { A, G, GRIP_IN_HAND, hipForShoulder, standLegs } from '@/exercises/common.ts';
import { bandCurve, bandLine, cableColumn, cableHandle, cableLine, frontGripAt, pullUpBar, sagPoints, towardCable, weightStack, workTL } from '@/exercises/equipment/index.ts';

export type Catalog = {
  id: string;
  name: string;
  en: string;
  equipment: LibraryMeta['equipment'];
  sources: string[];
};

const catalog = (x: Catalog): LibraryMeta => ({ en: x.en, family: 'vertical-pull', equipment: x.equipment, sources: x.sources });
const pullTL = workTL(0.35);

type SideMode = 'seated' | 'standing' | 'kneeling';
type Attachment = 'bar' | 'd' | 'rope' | 'vbar' | 'end';

export function sidePulldown(x: Catalog, opts: {
  mode?: SideMode;
  attachment?: Attachment;
  band?: boolean;
  unilateral?: boolean;
  neutral?: boolean;
  wide?: boolean;
  behindNeck?: boolean;
} = {}): SideExercise {
  const mode = opts.mode ?? 'seated';
  const seated = mode === 'seated';
  const standing = mode === 'standing';
  const spine = seated
    ? { lumbar: -103, thoracic: -105 }
    : standing ? { lumbar: -94, thoracic: -96 } : { lumbar: -91, thoracic: -93 };
  const hip: Vec2 = seated ? [246, G - 104] : standing ? [225, G - A - 183] : [226, G - 107];
  const legs: LimbPair = seated
    ? {
      near: { target: [hip[0] + 100, G - A], foot: 0, side: [0, -1] },
      far: { target: [hip[0] + 94, G - A], foot: 0, side: [0, -1] },
    }
    : standing ? standLegs(225, -6)
      : {
        // Knees stay grounded while the shins fold behind the kneeling athlete.
        near: { a1: 90, a2: 180, foot: 180 },
        far: { a1: 91, a2: 179, foot: 179 },
      };
  const base: Omit<Pose, 'arms'> = { hip, spine, neck: seated ? -99 : -91, head: seated ? -101 : -92, legs };
  const probe = solve({ ...base, arms: { near: { a1: 0, a2: 0 }, far: { a1: 0, a2: 0 } } });
  // The extended position is 122–125 px from the shoulder. At the chest, 65–75 px produces a controlled 60–80° elbow.
  const top: Vec2 = mode === 'kneeling'
    ? [probe.S[0] + 42, probe.S[1] - 117]
    // A wide grip still begins with a long elbow. This target remains within
    // the 126 px arm reach throughout the seated and standing configurations.
    : [probe.S[0] + (opts.wide ? 60 : 51), probe.S[1] - (opts.wide ? 109 : 114)];
  const bottom: Vec2 = mode === 'kneeling'
    ? [probe.S[0] + 55, probe.S[1] + 37]
    : opts.behindNeck
      ? [probe.S[0] - 55, probe.S[1] + 25]
      : [probe.S[0] + (opts.wide ? 66 : 58), probe.S[1] + 34];
  // The side-view figure faces screen right. The high pulley must be in front
  // of a seated athlete, not behind the backrest.
  const anchor: Vec2 = mode === 'kneeling' ? [324, 48] : [350, standing ? 42 : 34];
  const column = cableColumn({ x: anchor[0] - 16, pulleyY: anchor[1], toward: 1 });
  const attachment = opts.attachment ?? (opts.unilateral ? 'd' : 'end');
  const grip = (J: Joints): Vec2 => add(J.wrist_n, [0, -GRIP_IN_HAND]);
  const fixedProps = (pal: Parameters<NonNullable<SideExercise['props']>>[0]): Props => ({
    back: [
      ...(!opts.band ? column.draw(pal) : [
        { kind: 'box' as const, nm: 'band-anchor-post', color: pal.metalDark, c: [anchor[0], (anchor[1] + G) / 2] as Vec2, s: [12, G - anchor[1]] as Vec2, r: 3 },
        { kind: 'box' as const, nm: 'band-anchor-cap', color: pal.metal, c: [anchor[0] - 18, anchor[1]] as Vec2, s: [48, 10] as Vec2, r: 3 },
      ]),
      ...(seated ? [
        { kind: 'box' as const, nm: 'seat-arm', color: pal.metalDark, c: [205, G - 58] as Vec2, s: [96, 10] as Vec2, r: 3 },
        { kind: 'box' as const, nm: 'seat-post', color: pal.metalDark, c: [246, G - 48] as Vec2, s: [14, 84] as Vec2, r: 3 },
        { kind: 'box' as const, nm: 'seat', color: pal.pad, c: [252, G - 79] as Vec2, s: [98, 16] as Vec2, r: 8 },
      ] : []),
      ...(mode === 'kneeling' ? [
        { kind: 'box' as const, nm: 'anchor-post', color: pal.metalDark, c: [324, (48 + G) / 2] as Vec2, s: [12, G - 48] as Vec2, r: 3 },
      ] : []),
    ],
    front: seated ? [
      { kind: 'box' as const, nm: 'thigh-pad', color: pal.pad, c: [probe.knee_n[0] - 15, probe.knee_n[1] - 21] as Vec2, s: [42, 18] as Vec2, r: 9 },
    ] : undefined,
  });
  const moving = opts.band
    ? opts.unilateral
      ? [bandCurve<Joints>((J) => sagPoints(anchor, grip(J), 4), 'underNearArm', 'High anchor band')]
      : [
        bandCurve<Joints>((J) => sagPoints(add(anchor, [-8, 0]), grip(J), 4), 'underNearArm', 'Near high-anchor band'),
        bandLine<Joints>((J) => [add(anchor, [8, 0]), add(grip(J), sub(J.Sf, J.S))], 'overFarArm', 'Far high-anchor band'),
      ]
    : [
      cableLine<Joints>(anchor, (J) => grip(J)),
      cableHandle<Joints>(attachment, (J) => ({ p: grip(J), a: towardCable(grip(J), anchor) }), { len: opts.wide ? 116 : 64 }),
    ];
  return {
    id: x.id, name: x.name, tl: pullTL, meta: catalog(x), props: fixedProps,
    propsBox: [Math.min(column.box[0], 145), Math.max(column.box[1], 362)],
    muscles: [
      { m: 'lats', side: opts.unilateral ? 'near' : 'both' },
      { m: 'biceps', side: opts.unilateral ? 'near' : 'both', scale: 0.55 },
      { m: 'upperBack', scale: 0.45 },
      ...(opts.band ? [{ m: 'forearms' as const, side: opts.unilateral ? 'near' as const : 'both' as const, scale: 0.3 }] : []),
    ],
    dynamic: moving,
    pose(t) {
      const p = smooth(pullTL.at(t).p);
      const hand = lerpV(top, bottom, p);
      return {
        ...base,
        arms: opts.unilateral
          ? {
            near: { target: hand, side: [-1, 0.25], hand: -90 },
            far: { a1: 80, a2: 90, hand: 90 },
          }
          : {
            near: { target: hand, side: [-1, 0.25], hand: -90 },
            far: { target: (J) => add(hand, sub(J.Sf, J.S)), side: [-1, 0.25], hand: -90 },
          },
      };
    },
  } satisfies SideExercise;
}

export function sidePullUp(x: Catalog, opts: { assisted?: boolean; neutral?: boolean; standingAssist?: boolean; band?: boolean } = {}): SideExercise {
  const barY = 14;
  const wrist: Vec2 = [254, barY + GRIP_IN_HAND];
  const station = pullUpBar({ view: 'side', x: wrist[0], y: barY });
  const stack = weightStack({ x: 156, top: 54, lift: (t) => 27 * pullTL.at(t).p });
  const upper = (p: number): Omit<Pose, 'legs' | 'arms'> => {
    // The torso rises under fixed hands. Top shoulder-to-wrist distance gives about a 55° elbow.
    const S: Vec2 = [254, lerp(149, 80, p)];
    const spine = { lumbar: -90, thoracic: -90 };
    return { hip: hipForShoulder(S, spine), spine, neck: -90, head: -90, farHip: 0 };
  };
  return {
    id: x.id, name: x.name, tl: pullTL, meta: catalog(x),
    muscles: [{ m: 'lats' }, { m: 'biceps', side: 'both', scale: 0.6 }, { m: 'forearms', side: 'both', scale: 0.35 }],
    props: (pal): Props => ({
      back: [
        ...station.draw(pal),
        ...(opts.neutral ? [
          { kind: 'box' as const, nm: 'near-parallel-handle', color: pal.metal, c: [wrist[0] - 4, barY + 17] as Vec2, s: [8, 34] as Vec2, r: 4 },
          { kind: 'box' as const, nm: 'far-parallel-handle', color: pal.metalDark, c: [wrist[0] + 5, barY + 17] as Vec2, s: [7, 34] as Vec2, r: 3.5 },
        ] : []),
        ...(opts.assisted ? [
          ...stack.fixed(pal),
          { kind: 'box' as const, nm: 'assist-frame', color: pal.metalDark, c: [207, (66 + G) / 2] as Vec2, s: [12, G - 66] as Vec2, r: 3 },
          { kind: 'box' as const, nm: 'assist-link', color: pal.metal, c: [206, 260] as Vec2, s: [92, 9] as Vec2, r: 4 },
        ] : []),
      ],
    }),
    propsBox: opts.assisted ? [stack.box[0], station.box[1]] : station.box,
    dynamic: [
      ...(opts.assisted ? [
        stack.dynamic,
        {
          nm: opts.standingAssist ? 'Counterweight foot platform' : 'Counterweight knee pad', kind: 'rigid' as const, z: 'back' as const,
          shapes: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => [{ kind: 'box' as const, nm: 'support-pad', color: pal.pad, c: [0, 0] as Vec2, s: opts.standingAssist ? [84, 17] as Vec2 : [54, 17] as Vec2, r: 8 }],
          at: (J: Joints) => ({ p: opts.standingAssist ? add(J.ankle_n, [0, 14]) : add(J.knee_n, [9, 13]), a: 0 }),
        },
      ] : []),
      ...(opts.band ? [bandCurve<Joints>((J) => sagPoints([wrist[0], barY], add(J.knee_n, [0, 8]), 8), 'underNearArm', 'Assistance band loop')] : []),
    ],
    pose(t) {
      const p = smooth(pullTL.at(t).p);
      return {
        ...upper(p),
        // A free hang uses bent knees to keep the feet visibly above the floor.
        // Standing assisted versions keep straight legs on a moving platform.
        legs: opts.standingAssist
          ? { near: { a1: 90, a2: 90, foot: 0 }, far: { a1: 91, a2: 91, foot: 1 } }
          : { near: { a1: 90, a2: 180, foot: 180 }, far: { a1: 91, a2: 179, foot: 179 } },
        arms: {
          near: { target: wrist, side: [-1, 0], hand: -90 },
          far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: -90 },
        },
      };
    },
  } satisfies SideExercise;
}

export function frontPulldown(x: Catalog, opts: {
  wide?: boolean;
  unilateral?: boolean;
  alternating?: boolean;
  crossed?: boolean;
  crossover?: boolean;
  behindNeck?: boolean;
  machine?: boolean;
  chestPad?: boolean;
} = {}): FrontExercise {
  const seated = !opts.crossover;
  // The overhead stretch needs a nearly straight elbow. The chest position
  // keeps a 60–80° elbow rather than the former over-flexed 41° machine pull.
  const topY = opts.crossover ? 300 : opts.crossed ? 350 : opts.wide ? 361 : 368;
  const bottomY = opts.crossover ? 220 : opts.behindNeck ? 284 : 220;
  const topX = opts.crossover ? 118 : opts.wide ? 90 : opts.unilateral ? 76 : 72;
  const bottomX = opts.crossover ? 52 : opts.wide ? 90 : opts.unilateral ? 78 : 80;
  const pulleyY = 44;
  const activeTL = opts.alternating
    ? { total: 3.8, at: (t: number) => ({ p: Math.sin(Math.PI * 2 * t) ** 2, e: 0.3 + 0.7 * Math.sin(Math.PI * 2 * t) ** 2, seg: { d: 3.8, from: 0, to: 1 }, u: t }) }
    : pullTL;
  const handTarget = (side: 'l' | 'r', p: number): Vec3 => {
    const sign = side === 'l' ? 1 : -1;
    const x0 = opts.crossed ? -sign * 42 : sign * topX;
    const x1 = (opts.crossover ? -sign : sign) * bottomX;
    return [lerp(x0, x1, p), lerp(topY, bottomY, p), opts.crossover ? 18 : 0];
  };
  const topBar = pullUpBar({ view: 'front', x: 0, y: pulleyY - 5, width: 304 });
  return {
    id: x.id, name: x.name, view: 'front', tl: activeTL, meta: catalog(x),
    muscles: [
      { m: 'lats', side: opts.unilateral ? 'l' : 'both' },
      { m: 'biceps', side: opts.unilateral ? 'l' : 'both', scale: 0.55 },
      { m: 'upperBack', scale: 0.45, region: { view: 'front', part: 'lats', c: [28, 2], s: [7, 24], mirror: true } },
    ],
    props: (pal): Props => ({
      back: [
        ...(opts.crossover ? [
          ...[-1, 1].flatMap((s) => [
            { kind: 'box' as const, nm: `crossover-upright-${s}`, color: pal.prop, c: [s * 145, 243] as Vec2, s: [22, 410] as Vec2, r: 4 },
            { kind: 'oval' as const, nm: `crossover-pulley-${s}`, color: pal.metal, c: [s * 132, 174] as Vec2, s: [18, 18] as Vec2 },
          ]),
        ] : opts.machine ? [
          { kind: 'box' as const, nm: 'machine-upright-left', color: pal.prop, c: [-142, 242] as Vec2, s: [22, 394] as Vec2, r: 4 },
          { kind: 'box' as const, nm: 'machine-upright-right', color: pal.prop, c: [142, 242] as Vec2, s: [22, 394] as Vec2, r: 4 },
          { kind: 'box' as const, nm: 'machine-top', color: pal.metal, c: [0, 46] as Vec2, s: [300, 16] as Vec2, r: 5 },
        ] : topBar.draw(pal)),
        ...(seated ? [
          { kind: 'box' as const, nm: 'seat-post', color: pal.metalDark, c: [0, 379] as Vec2, s: [16, 102] as Vec2, r: 3 },
          { kind: 'box' as const, nm: 'seat', color: pal.pad, c: [0, 326] as Vec2, s: [126, 18] as Vec2, r: 8 },
        ] : []),
      ],
      front: seated ? [
        { kind: 'box' as const, nm: 'thigh-pad', color: pal.pad, c: [0, 349] as Vec2, s: [134, 20] as Vec2, r: 9 },
        ...(opts.chestPad ? [{ kind: 'box' as const, nm: 'chest-pad', color: pal.pad, c: [0, 231] as Vec2, s: [82, 70] as Vec2, r: 10 }] : []),
      ] : undefined,
    }),
    propsBox: [-162, 162],
    dynamic: opts.crossed ? [
      cableLine<FrontJoints>([-112, pulleyY], (J) => frontGripAt(J, 'l'), 'Left crossed cable'),
      cableLine<FrontJoints>([112, pulleyY], (J) => frontGripAt(J, 'r'), 'Right crossed cable'),
      cableHandle<FrontJoints>('d', (J) => {
        const p = frontGripAt(J, 'l');
        return { p, a: towardCable(p, [-112, pulleyY]) };
      }),
      cableHandle<FrontJoints>('d', (J) => {
        const p = frontGripAt(J, 'r');
        return { p, a: towardCable(p, [112, pulleyY]) };
      }),
    ] : opts.crossover ? [
      cableLine<FrontJoints>([-132, 174], (J) => frontGripAt(J, 'l'), 'Left shoulder-height cable'),
      cableLine<FrontJoints>([132, 174], (J) => frontGripAt(J, 'r'), 'Right shoulder-height cable'),
      cableHandle<FrontJoints>('d', (J) => {
        const p = frontGripAt(J, 'l');
        return { p, a: towardCable(p, [-132, 174]) };
      }),
      cableHandle<FrontJoints>('d', (J) => {
        const p = frontGripAt(J, 'r');
        return { p, a: towardCable(p, [132, 174]) };
      }),
    ] : [
      cableLine<FrontJoints>([0, pulleyY], (J) => {
        const l = frontGripAt(J, 'l'), r = frontGripAt(J, 'r');
        return [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2];
      }, 'Center cable'),
      cableHandle<FrontJoints>(opts.unilateral ? 'd' : 'bar', (J) => {
        const l = frontGripAt(J, 'l'), r = frontGripAt(J, 'r');
        return { p: [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2], a: 0 };
      }, { len: opts.wide ? 196 : 148, z: opts.behindNeck ? 'back' : undefined }),
    ],
    pose(t) {
      const p = smooth(activeTL.at(t).p);
      const phase = Math.sin(Math.PI * 2 * t);
      const leftPull = opts.alternating ? Math.max(0, phase) ** 2 : p;
      const rightPull = opts.alternating ? Math.max(0, -phase) ** 2 : p;
      const pelvisY = seated ? 142 : 194;
      const feetY = BODY.ankleH;
      return {
        pelvis: [0, pelvisY, opts.crossover ? 18 : 0],
        hips: opts.crossover ? { pitch: 13 } : { pitch: -3 },
        spine: opts.crossover ? { pitch: 9 } : { pitch: -2 },
        neck: opts.behindNeck ? { pitch: 18 } : undefined,
        head: opts.behindNeck ? { pitch: 15 } : undefined,
        legs: seated
          ? { l: { target: [44, feetY, 58] }, r: { target: [-44, feetY, 58] } }
          : { l: { target: [22, feetY, 0] }, r: { target: [-22, feetY, 0] } },
        arms: opts.alternating
          ? {
            l: { target: handTarget('l', leftPull), pole: [0, 0, -1] },
            r: { target: handTarget('r', rightPull), pole: [0, 0, -1] },
          }
          : opts.unilateral
          ? {
            l: { target: handTarget('l', p), pole: [0, 0, -1] },
            r: { target: handTarget('r', 0), pole: [0, 0, -1] },
          }
          : {
            l: { target: handTarget('l', p), pole: [0, 0, -1] },
            r: { target: handTarget('r', p), pole: [0, 0, -1] },
          },
      };
    },
  } satisfies FrontExercise;
}

export function frontPullUp(x: Catalog, opts: {
  wide?: boolean;
  alternate?: boolean;
  archer?: boolean;
  assisted?: boolean;
  standingAssist?: boolean;
  behindNeck?: boolean;
} = {}): FrontExercise {
  const barY = 28;
  const gripY = G - (barY + 9);
  // 85 px is visibly wider than the 66 px shoulder line while preserving reach during the lateral variations.
  const gripX = opts.wide || opts.archer ? 85 : 71;
  const station = pullUpBar({ view: 'front', x: 0, y: barY, width: opts.wide || opts.archer ? 254 : 190 });
  const supportTL = opts.alternate || opts.archer
    ? { total: 3.8, at: (t: number) => ({ p: Math.sin(Math.PI * 2 * t) ** 2, e: 0.3 + 0.7 * Math.sin(Math.PI * 2 * t) ** 2, seg: { d: 3.8, from: 0, to: 1 }, u: t }) }
    : pullTL;
  const stack = weightStack({ x: -142, top: 58, lift: (t) => 28 * supportTL.at(t).p });
  return {
    id: x.id, name: x.name, view: 'front', tl: supportTL, meta: catalog(x),
    muscles: [
      { m: 'lats' }, { m: 'biceps', side: 'both', scale: 0.6 }, { m: 'forearms', side: 'both', scale: 0.35 },
      ...(opts.archer || opts.alternate ? [{ m: 'obliques' as const, scale: 0.25 }] : []),
    ],
    props: (pal): Props => ({
      back: [
        ...station.draw(pal),
        ...(opts.assisted ? [
          ...stack.fixed(pal),
          { kind: 'box' as const, nm: 'assist-frame', color: pal.prop, c: [0, 244] as Vec2, s: [12, 378] as Vec2, r: 4 },
          { kind: 'box' as const, nm: 'assist-crossrail', color: pal.metalDark, c: [0, 334] as Vec2, s: [192, 10] as Vec2, r: 3 },
        ] : []),
      ],
    }),
    propsBox: opts.assisted ? [stack.box[0], station.box[1]] : station.box,
    dynamic: opts.assisted ? [
      {
        nm: opts.standingAssist ? 'Counterweight foot platform' : 'Counterweight knee pad', kind: 'rigid', z: 'back',
        shapes: (pal) => [{ kind: 'box' as const, nm: 'assist-pad', color: pal.pad, c: [0, 0] as Vec2, s: opts.standingAssist ? [108, 18] as Vec2 : [76, 18] as Vec2, r: 8 }],
        at: (J) => {
          const p = project(opts.standingAssist ? J.ankle_l : J.knee_l);
          return { p: [p[0], p[1] + (opts.standingAssist ? 14 : 0)] as Vec2, a: 0 };
        },
      },
    ] : undefined,
    pose(t) {
      const p = smooth(supportTL.at(t).p);
      const phase = Math.sin(Math.PI * 2 * t);
      const shift = opts.archer ? 22 * phase : opts.alternate ? 18 * phase : 0;
      // Hangs use bent knees, so the shoes remain visibly clear of the floor.
      // The standing machine variants keep straight legs on their moving platform.
      const pelvisY = opts.wide || opts.archer ? 194 + 71 * p : 188 + 77 * p;
      const footY = opts.standingAssist ? BODY.ankleH + 71 * p : pelvisY - 124;
      const target = (side: 'l' | 'r'): Vec3 => [side === 'l' ? gripX : -gripX, gripY, 0];
      return {
        pelvis: [shift, pelvisY, 0],
        hips: { yaw: opts.archer || opts.alternate ? 4 * phase : 0 },
        spine: { yaw: opts.archer || opts.alternate ? 5 * phase : 0 },
        neck: opts.behindNeck ? { pitch: 16 } : undefined,
        head: opts.behindNeck ? { pitch: 18 } : undefined,
        legs: {
          l: { target: [22 + shift, footY, opts.standingAssist ? 0 : 22], pole: opts.standingAssist ? undefined : [0, 0, 1] },
          r: { target: [-22 + shift, footY, opts.standingAssist ? 0 : 22], pole: opts.standingAssist ? undefined : [0, 0, 1] },
        },
        arms: {
          l: { target: target('l'), pole: [0, 0, -1] },
          r: { target: target('r'), pole: [0, 0, -1] },
        },
      };
    },
  } satisfies FrontExercise;
}
