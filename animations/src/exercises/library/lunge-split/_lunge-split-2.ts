// Shared side-view poses for the lunge-split-2 work list. The lead knee tracks over its planted foot at the lunge
// bottom, the rear knee stays above the floor, and the chest stays tall. Step-ups keep the lead foot fully on the
// platform; rear-foot-elevated variations keep the rear foot on its support throughout the repetition.
import type { MuscleSpec, SideExercise } from '@/exercise.ts';
import { clamp, lerp, lerpV, smooth, timeline, type Timeline, type Vec2 } from '@/math.ts';
import type { Joints, LimbPair, LimbSpec, Pose } from '@/rig.ts';
import { A, G, toesDown } from '@/exercises/common.ts';
import { barbell, dumbbell, flatBench, kettlebell, plyoBox, smithRails, workTL } from '@/exercises/equipment/index.ts';

type Lead = 'near' | 'far';
type LungeDirection = 'forward' | 'reverse';
type ArmStyle = 'hang' | 'swing' | 'curl' | 'triceps';

const X0 = 250;
const STRIDE = 166;
// Leave 0.15 px of leg slack: this keeps the standing knee in the 175–180° reference range without an IK overreach.
const HIP_STAND: Vec2 = [X0, G - A - 183.85];
const lungeTL = workTL(0.3);
const alternatingTL: Timeline = {
  total: lungeTL.total * 2,
  at: (t) => lungeTL.at((t % 0.5) * 2),
};

const hangingArms = (): LimbPair => ({
  near: { a1: 90, a2: 90, hand: 90 },
  far: { a1: 90, a2: 90, hand: 90 },
});

function armsFor(style: ArmStyle, p: number): LimbPair {
  if (style === 'hang') return hangingArms();
  if (style === 'swing') {
    // The source calls for a forward-and-upward swing, so the straight arms finish above horizontal.
    const a = lerp(90, -18, p);
    return { near: { a1: a, a2: a, hand: a }, far: { a1: a, a2: a, hand: a } };
  }
  if (style === 'curl') {
    const fore = lerp(90, -50, p);
    return { near: { a1: 90, a2: fore, hand: fore }, far: { a1: 90, a2: fore, hand: fore } };
  }
  // The arms first travel overhead, then straighten from a bent-behind-head position at the lunge bottom.
  const up = smooth(clamp(p / 0.42, 0, 1));
  const extend = smooth(clamp((p - 0.78) / 0.22, 0, 1));
  const upper = lerp(90, -90, up);
  const fore = p < 0.78 ? lerp(90, -35, up) : lerp(-35, -90, extend);
  return { near: { a1: upper, a2: fore, hand: fore }, far: { a1: upper, a2: fore, hand: fore } };
}

function lungePose(p: number, direction: LungeDirection, lead: Lead, arms: LimbPair): Pose {
  const u = smooth(clamp(p / 0.65, 0, 1));
  const heel = lerp(A, 30, smooth(clamp((p - 0.35) / 0.45, 0, 1)));
  let front: LimbSpec, rear: LimbSpec, hipBottom: Vec2;
  if (direction === 'forward') {
    const frontX = lerp(X0, X0 + STRIDE, u);
    const frontAnkle: Vec2 = [frontX, G - A - 16 * Math.sin(Math.PI * u)];
    front = { target: frontAnkle, foot: 0, side: [1, 0] };
    rear = { target: [X0 - 5, G - heel], foot: toesDown(heel), side: [1, 0] };
    hipBottom = [X0 + STRIDE - 84, G - 118];
  } else {
    front = { target: [X0, G - A], foot: 0, side: [1, 0] };
    const rearX = lerp(X0 - 5, X0 - STRIDE, u);
    rear = { target: [rearX, G - heel - 16 * Math.sin(Math.PI * u)], foot: toesDown(heel), side: [1, 0] };
    hipBottom = [X0 - 84, G - 118];
  }
  return {
    hip: lerpV(HIP_STAND, hipBottom, p),
    spine: { lumbar: lerp(-90, -84, p), thoracic: lerp(-91, -87, p) },
    neck: lerp(-88, -85, p), head: -88,
    legs: lead === 'near' ? { near: front, far: rear } : { near: rear, far: front },
    arms,
  };
}

function phaseAt(t: number, alternate: boolean): { p: number; e: number; lead: Lead } {
  const phase = lungeTL.at(alternate ? (t % 0.5) * 2 : t);
  return { p: phase.p, e: phase.e, lead: alternate && t >= 0.5 ? 'far' : 'near' };
}

function lungeMuscles(at: (t: number) => { e: number; lead: Lead }, arm: ArmStyle): MuscleSpec[] {
  const legEffort = (side: Lead) => (t: number): number => {
    const phase = at(t);
    return phase.e * (phase.lead === side ? 1 : 0.28);
  };
  const base: MuscleSpec[] = [
    { m: 'quads', side: 'near', e: legEffort('near') },
    { m: 'quads', side: 'far', e: legEffort('far') },
    { m: 'glutes', e: (t) => at(t).e },
    { m: 'hamstrings', side: 'both', scale: 0.45, e: (t) => at(t).e },
  ];
  if (arm === 'curl') return [{ m: 'biceps', side: 'both' }, ...base.map((m) => ({ ...m, scale: m.scale ?? 0.55 }))];
  if (arm === 'triceps') return [{ m: 'triceps', side: 'both' }, { m: 'delts', scale: 0.35 }, ...base.map((m) => ({ ...m, scale: m.scale ?? 0.4 }))];
  return base;
}

export function dumbbellLunge(options: {
  id: string; name: string; en: string; sources: string[]; direction: LungeDirection; alternate?: boolean; arm?: ArmStyle;
}): SideExercise {
  const alternate = options.alternate ?? false;
  const arm = options.arm ?? 'hang';
  const phase = (t: number) => phaseAt(t, alternate);
  return {
    id: options.id, name: options.name, tl: alternate ? alternatingTL : lungeTL,
    meta: { en: options.en, family: 'lunge-split', equipment: ['dumbbell'], sources: options.sources },
    muscles: lungeMuscles(phase, arm),
    dynamic: [dumbbell('f', arm === 'curl' ? 'end' : 'profile'), dumbbell('n', arm === 'curl' ? 'end' : 'profile')],
    pose: (t) => {
      const current = phase(t);
      return lungePose(current.p, options.direction, current.lead, armsFor(arm, current.p));
    },
  };
}

function stepPose(p: number, boxTop: number, free: 'platform' | 'knee', arms: LimbPair): Pose {
  const leadAnkle: Vec2 = [270, boxTop - A];
  // At the top, the supporting knee is nearly straight: this is a full step-up, not a partial squat on the box.
  const hip = lerpV([220, 260], [270, boxTop - A - 183], p);
  const freeEnd: Vec2 = free === 'platform' ? [280, boxTop - A] : [300, boxTop - 62];
  const freeStart: Vec2 = [210, G - A];
  const foot = lerpV(freeStart, freeEnd, smooth(p));
  foot[1] -= 16 * Math.sin(Math.PI * p);
  return {
    hip,
    spine: { lumbar: -90, thoracic: -91 }, neck: -89, head: -90,
    legs: {
      near: { target: leadAnkle, foot: 0, side: [1, 0] },
      far: { target: foot, foot: 0, side: [1, 0] },
    },
    arms,
  };
}

export function dumbbellStepUp(options: {
  id: string; name: string; en: string; sources: string[]; kneeRaise?: boolean; curl?: boolean;
}): SideExercise {
  const box = plyoBox({ x: 300, h: 74, w: 140 });
  const tl = workTL(0.35);
  const kneeRaise = options.kneeRaise ?? false;
  const curl = options.curl ?? false;
  return {
    id: options.id, name: options.name, tl,
    meta: { en: options.en, family: 'lunge-split', equipment: ['dumbbell', 'box'], sources: options.sources },
    muscles: curl
      ? [{ m: 'biceps', side: 'both' }, { m: 'quads', side: 'near', scale: 0.6 }, { m: 'glutes', scale: 0.55 }]
      : [{ m: 'quads', side: 'near' }, { m: 'glutes' }, { m: 'hamstrings', side: 'near', scale: 0.45 }],
    props: (pal) => ({ back: box.draw(pal) }), propsBox: box.box,
    dynamic: [dumbbell('f', curl ? 'end' : 'profile'), dumbbell('n', curl ? 'end' : 'profile')],
    pose: (t) => {
      const p = tl.at(t).p;
      return stepPose(p, box.top, kneeRaise ? 'knee' : 'platform', curl ? armsFor('curl', p) : hangingArms());
    },
  };
}

export function boxAssistedHighStepUp(): SideExercise {
  const box = plyoBox({ x: 292, h: 88, w: 132 });
  const tl = workTL(0.4);
  const ropeX = 270;
  return {
    id: 'box-assisted-high-step-up', name: '扶绳高箱上步', tl,
    meta: { en: 'Box Assisted High Step-Up', family: 'lunge-split', equipment: ['box', 'rope'], sources: ['fe:Single-Leg_High_Box_Squat'] },
    muscles: [{ m: 'quads', side: 'near' }, { m: 'glutes' }, { m: 'hamstrings', side: 'near', scale: 0.45 }],
    props: (pal) => ({
      back: [
        ...box.draw(pal),
        { kind: 'box', nm: 'rope-anchor', color: pal.metalDark, c: [ropeX, 20], s: [28, 10], r: 3 },
        { kind: 'box', nm: 'balance-rope', color: pal.cable, c: [ropeX, 190], s: [3.5, 340], r: 1.75 },
      ],
    }),
    propsBox: box.box,
    pose: (t) => {
      const p = tl.at(t).p;
      const leadAnkle: Vec2 = [262, box.top - A];
      const hip = lerpV([215, 260], [262, box.top - A - 183], p);
      // The non-working leg hangs unsupported and bends as the body rises; it never remains planted on the floor.
      const trailing = lerpV([200, G - A], [225, box.top - 55], smooth(p));
      trailing[1] -= 14 * Math.sin(Math.PI * p);
      return {
        hip, spine: { lumbar: -90, thoracic: -91 }, neck: -89, head: -90,
        legs: {
          near: { target: leadAnkle, foot: 0, side: [1, 0] },
          far: { target: trailing, foot: 0, side: [1, 0] },
        },
        arms: {
          near: { target: [ropeX, lerp(48, 28, p)], side: [-1, 0], hand: -90 },
          far: { a1: 90, a2: 90, hand: 90 },
        },
      };
    },
  };
}

export function boxStepUpWithKneeRaise(): SideExercise {
  const box = plyoBox({ x: 300, h: 74, w: 140 });
  const tl = workTL(0.35);
  return {
    id: 'box-step-up-with-knee-raise', name: '登箱提膝', tl,
    meta: { en: 'Box Step-Up with Knee Raise', family: 'lunge-split', equipment: ['box'], sources: ['fe:Step-up_with_Knee_Raise'] },
    muscles: [{ m: 'glutes', side: 'near' }, { m: 'quads', side: 'near', scale: 0.65 }, { m: 'hamstrings', side: 'near', scale: 0.45 }],
    props: (pal) => ({ back: box.draw(pal) }), propsBox: box.box,
    pose: (t) => stepPose(tl.at(t).p, box.top, 'knee', hangingArms()),
  };
}

const BULGAR_FRONT: Vec2 = [315, G - A];
const BULGAR_REAR: Vec2 = [105, G - 90 - A];
// The front knee is almost straight at the top, then reaches about 90° at the controlled bottom.
const BULGAR_HIP_TOP: Vec2 = [250, 267];
const BULGAR_HIP_LOW: Vec2 = [250, 327];

function bulgarianPose(p: number, rear: Vec2, arms: LimbPair): Pose {
  return {
    hip: lerpV(BULGAR_HIP_TOP, BULGAR_HIP_LOW, p),
    spine: { lumbar: -90, thoracic: -91 }, neck: -89, head: -90,
    legs: {
      near: { target: BULGAR_FRONT, foot: 0, side: [1, 0] },
      far: { target: rear, foot: 180, side: [1, 0] },
    },
    arms,
  };
}

export function dumbbellBulgarian(): SideExercise {
  const bench = flatBench({ view: 'side', x: 175 });
  const tl = workTL(0.35);
  return {
    id: 'dumbbell-bulgarian-split-squat', name: '哑铃保加利亚分腿蹲', tl,
    meta: {
      en: 'Dumbbell Bulgarian Split Squat', family: 'lunge-split', equipment: ['dumbbell', 'bench'],
      sources: ['fe:Split_Squat_with_Dumbbells', 'hz:0410'],
    },
    muscles: [{ m: 'quads', side: 'near' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'near', scale: 0.45 }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [dumbbell('f', 'profile'), dumbbell('n', 'profile')],
    pose: (t) => bulgarianPose(tl.at(t).p, BULGAR_REAR, hangingArms()),
  };
}

export function suspensionSplitSquat(): SideExercise {
  const tl = workTL(0.35);
  const anchor: Vec2 = [104, 72];
  const rear: Vec2 = [105, G - 105 - A];
  return {
    id: 'suspension-split-squat', name: '悬吊分腿蹲', tl,
    meta: {
      en: 'Suspension Split Squat', family: 'lunge-split', equipment: ['suspension'],
      sources: ['fe:Suspended_Split_Squat', 'hz:0809'],
    },
    muscles: [{ m: 'quads', side: 'near' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'near', scale: 0.45 }],
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'suspension-anchor', color: pal.metalDark, c: anchor, s: [34, 11], r: 3 },
        { kind: 'box', nm: 'suspension-mount', color: pal.metal, c: [anchor[0], anchor[1] + 13], s: [9, 18], r: 3 },
      ],
    }),
    dynamic: [
      {
        nm: 'Suspension Strap', kind: 'line', z: 'back', width: 5, color: (pal) => pal.propDark,
        at: (J) => [anchor, J.ankle_f],
      },
      {
        nm: 'Foot Cradle', kind: 'rigid', z: 'back',
        shapes: (pal) => [
          { kind: 'ring', nm: 'cradle-loop', color: pal.pad, c: [0, 0], s: [34, 18], w: 5 },
          { kind: 'box', nm: 'cradle-strap', color: pal.propDark, c: [0, -12], s: [7, 18], r: 3 },
        ],
        at: (J) => ({ p: J.ankle_f, a: 0 }),
      },
    ],
    pose: (t) => bulgarianPose(tl.at(t).p, rear, hangingArms()),
  };
}

export function kettlebellLungePassThrough(): SideExercise {
  const tl = workTL(0.35);
  const phase = (t: number) => tl.at(t);
  return {
    id: 'kettlebell-lunge-pass-through', name: '壶铃弓步胯下换手', tl,
    meta: {
      en: 'Kettlebell Lunge Pass-Through', family: 'lunge-split', equipment: ['kettlebell'],
      sources: ['fe:Lunge_Pass_Through', 'hz:0536'],
    },
    muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'glutes' }, { m: 'quads', side: 'near', scale: 0.65 }],
    dynamic: [kettlebell((J, t) => {
      const q = phase(t).p;
      const near = handCenter(J, 'n'), far = handCenter(J, 'f');
      return { p: lerpV(near, far, q), a: 0 };
    }, 'face')],
    pose: (t) => {
      const p = phase(t).p;
      const passArms = (J: Joints, side: 'n' | 'f'): Vec2 => {
        // Pass immediately below the upper front thigh. Reaching farther toward the knee would pull the chest down
        // or overextend the shoulder, which conflicts with the required upright lunge.
        const lower = lerpV(J.H, J.knee_n, 0.14);
        const start = handStart(J, side);
        return lerpV(start, [lower[0] - 2, lower[1] + 7], p);
      };
      const base = lungePose(p, 'forward', 'near', {
        near: { target: (J) => passArms(J, 'n'), side: [-1, 0], hand: 90 },
        far: { target: (J) => passArms(J, 'f'), side: [-1, 0], hand: 90 },
      });
      return base;
    },
  };
}

function handStart(J: Joints, side: 'n' | 'f'): Vec2 {
  const S = side === 'n' ? J.S : J.Sf;
  return [S[0] + 2, S[1] + 123];
}

function handCenter(J: Joints, side: 'n' | 'f'): Vec2 {
  const wrist = side === 'n' ? J.wrist_n : J.wrist_f;
  const hand = side === 'n' ? J.hand_n.a : J.hand_f.a;
  const r = hand * Math.PI / 180;
  return [wrist[0] + 9 * Math.cos(r), wrist[1] + 9 * Math.sin(r)];
}

function smithPose(p: number, arms: LimbPair): Pose {
  return bulgarianPose(p, BULGAR_REAR, arms);
}

export function smithBulgarianHoldRail(): SideExercise {
  const railX = 250;
  const railBarY = 286;
  const rails = smithRails({ view: 'side', x: railX, top: 50 });
  const bench = flatBench({ view: 'side', x: 175 });
  const tl = workTL(0.35);
  return {
    id: 'smith-bulgarian-split-squat', name: '史密斯保加利亚分腿蹲', tl,
    meta: { en: 'Smith Bulgarian Split Squat', family: 'lunge-split', equipment: ['smith', 'bench'], sources: ['hz:0768'] },
    muscles: [{ m: 'quads', side: 'near' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'near', scale: 0.45 }],
    props: (pal) => ({ back: [...bench.draw(pal), ...rails.draw(pal)] }),
    propsBox: bench.box,
    // This is a fixed Smith bar used as a balance rail, not a plate that follows the torso.
    dynamic: [barbell({ view: 'side', plate: 'small', at: () => ({ p: [railX, railBarY] }), nm: 'Smith Stability Bar' })],
    pose: (t) => smithPose(tl.at(t).p, {
      near: { target: [railX, railBarY], side: [-1, 0], hand: 0 },
      far: { target: (J) => [railX + (J.Sf[0] - J.S[0]), railBarY + (J.Sf[1] - J.S[1])], side: [-1, 0], hand: 0 },
    }),
  };
}

export function smithMachineBulgarian(): SideExercise {
  const railX = 250;
  const rails = smithRails({ view: 'side', x: railX, top: 50 });
  const bench = flatBench({ view: 'side', x: 175 });
  const tl = workTL(0.35);
  return {
    id: 'smith-machine-bulgarian-split-squat', name: '史密斯保加利亚分腿蹲', tl,
    meta: {
      en: 'Smith Machine Bulgarian Split Squat', family: 'lunge-split', equipment: ['smith', 'bench'],
      sources: ['fe:Smith_Single-Leg_Split_Squat'],
    },
    muscles: [{ m: 'quads', side: 'near' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'near', scale: 0.45 }],
    props: (pal) => ({ back: [...bench.draw(pal), ...rails.draw(pal)] }), propsBox: bench.box,
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: [railX, J.S[1] + 4] }) })],
    pose: (t) => smithPose(tl.at(t).p, {
      near: { target: (J) => [railX + 6, J.S[1] + 12], side: [-1, 0], hand: 0 },
      far: { target: (J) => [railX - 3, J.Sf[1] + 12], side: [-1, 0], hand: 0 },
    }),
  };
}

export function smithSprintLunge(): SideExercise {
  const railX = 105;
  // The source requires the rear foot to rest on a fixed Smith bar at hip height.
  const railY = G - 180;
  const rails = smithRails({ view: 'side', x: railX, top: 50 });
  const tl = workTL(0.35);
  const rear: Vec2 = [railX, railY - A];
  return {
    id: 'smith-sprint-lunge', name: '史密斯冲刺弓步蹲', tl,
    meta: { en: 'Smith Sprint Lunge', family: 'lunge-split', equipment: ['smith'], sources: ['hz:0769'] },
    muscles: [{ m: 'glutes', side: 'near' }, { m: 'quads', side: 'near', scale: 0.65 }, { m: 'hamstrings', side: 'near', scale: 0.45 }],
    props: (pal) => ({ back: rails.draw(pal) }), propsBox: rails.box,
    dynamic: [barbell({ view: 'side', plate: 'small', at: () => ({ p: [railX, railY] }) })],
    pose: (t) => bulgarianPose(tl.at(t).p, rear, hangingArms()),
  };
}

export function weightedAlternatingForwardLunge(): SideExercise {
  const phase = (t: number) => phaseAt(t, true);
  return {
    id: 'weighted-alternating-forward-lunge', name: '交替前弓步蹲', tl: alternatingTL,
    // The source names this weighted but specifies no visible external load, so the animation only shows the stated bodyweight movement.
    meta: { en: 'Weighted Alternating Forward Lunge', family: 'lunge-split', equipment: ['bodyweight'], sources: ['hz:3642'] },
    muscles: lungeMuscles(phase, 'hang'),
    pose: (t) => {
      const current = phase(t);
      return lungePose(current.p, 'forward', current.lead, hangingArms());
    },
  };
}
