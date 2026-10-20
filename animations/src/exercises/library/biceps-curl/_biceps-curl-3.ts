// Reusable side-view curl poses for the biceps-curl-3 work list.
// Each builder fixes the upper arm at the specified support point and moves only the forearm.
import type { MovingPart, SideExercise } from '@/exercise.ts';
import { lerp, timeline, type Vec2 } from '@/math.ts';
import type { Joints } from '@/rig.ts';
import { A, G, standLegs } from '@/exercises/common.ts';
import {
  BALL, cableColumn, cableLine, dumbbell, flatBench, inclineBench, preacherBench,
  stabilityBall, workTL,
} from '@/exercises/equipment/index.ts';

type Grip = 'supinated' | 'neutral' | 'pronated';
type Mode = 'standing' | 'ball-standing' | 'seated' | 'preacher' | 'incline' | 'prone' | 'concentration' | 'ball-kneeling' | 'supine-cable' | 'curl-squat' | 'seated-press';

export interface CurlSpec {
  id: string;
  name: string;
  en: string;
  sources: string[];
  equipment: Array<'dumbbell' | 'cable' | 'bench' | 'stability-ball' | 'other'>;
  mode: Mode;
  grip?: Grip;
  /** Start neutral and turn the palms up as the elbow closes. */
  supinate?: boolean;
  /** Draw an off-centre dumbbell hub and keep the wrist extended. */
  offsetGrip?: boolean;
  alternating?: boolean;
  armBlaster?: boolean;
}

const normalTL = workTL(0.35);
// Each half of the loop is one complete controlled curl. `at` keeps the shared
// forearm highlight valid while the two biceps use their side-specific effort.
const alternatingTL = { total: normalTL.total * 2, at: (t: number) => normalTL.at((t * 2) % 1) };
const pAt = (t: number): number => normalTL.at(t).p;
const eAt = (t: number): number => normalTL.at(t).e;
/** One normal controlled curl in each half of an alternating loop. */
const altAt = (t: number, side: 'near' | 'far') => {
  const shift = side === 'near' ? 0 : 0.5;
  const u = (((t + shift) % 1) + 1) % 1;
  return normalTL.at(u * 2);
};

const curl = (p: number, upper: number, hang: number, top: number) => ({ upper, fore: lerp(hang, top, p) });
const handFor = (grip: Grip, fore: number, supination = 1): number => {
  if (grip === 'neutral') return fore - 90;
  if (grip === 'pronated') return fore + 180;
  // A neutral start rotates to a palm-up grip as the elbow closes.
  return fore - (1 - supination) * 90;
};
const dumbbellParts = (grip: Grip, both = true): MovingPart<Joints>[] => {
  const view = grip === 'neutral' ? 'profile' : 'end';
  return both ? [dumbbell('f', view), dumbbell('n', view)] : [dumbbell('n', view)];
};
/** An off-centre hub makes the flexor curl's intentionally offset grip visible end-on. */
const offsetDumbbellParts = (): MovingPart<Joints>[] => ['f', 'n'].map((side) => ({
  nm: `${side === 'n' ? 'Near' : 'Far'} Offset-Grip Dumbbell`, z: side === 'n' ? 'front' : 'overFarArm', kind: 'rigid',
  shapes: (pal) => [
    { kind: 'oval', nm: 'offset-plate', color: pal.plate, c: [0, 0], s: [28, 28] },
    { kind: 'oval', nm: 'offset-plate-face', color: pal.metalDark, c: [0, 0], s: [19, 19] },
    { kind: 'oval', nm: 'offset-hub', color: pal.metal, c: [5, 0], s: [8, 8] },
  ],
  at: (J) => {
    const hand = J[`hand_${side}` as 'hand_n' | 'hand_f'];
    const wrist = J[`wrist_${side}` as 'wrist_n' | 'wrist_f'];
    const r = hand.a * Math.PI / 180;
    return { p: [wrist[0] + Math.cos(r) * 9, wrist[1] + Math.sin(r) * 9] as Vec2 };
  },
}));

/** The curved lower plate of an arm blaster appears in front of the fixed upper arms. */
const armBlaster: MovingPart<Joints> = {
  nm: 'Arm Blaster', z: 'underNearArm', kind: 'rigid',
  shapes: (pal) => [
    { kind: 'poly', nm: 'blaster-plate', color: pal.metal, pts: [[-8, -34], [8, -40], [15, -8], [14, 27], [2, 41], [-10, 26]], smooth: true },
    { kind: 'box', nm: 'blaster-edge', color: pal.metalDark, c: [5, 24], s: [9, 35], r: 4 },
    { kind: 'poly', nm: 'blaster-strap', color: pal.padFar, w: 4, pts: [[-5, -30], [-28, -58], [-35, -91]], smooth: true, closed: false },
  ],
  at: (J) => ({ p: J.B(0.48), a: 0 }),
};

function standingPose(pNear: number, pFar: number, grip: Grip, ball = false, supinate = false) {
  const near = curl(pNear, 91, 86, -48), far = curl(pFar, 93, 88, -46);
  // A 0.2 px slack keeps the legs at about 175°, without an IK singularity.
  const hip: Vec2 = [256, G - A - 183.8];
  return {
    hip, spine: { lumbar: -89, thoracic: -91 }, neck: -86, head: -88,
    legs: ball
      ? {
        near: { target: [262, G - A] as Vec2, foot: 0, side: [1, 0] as Vec2 },
        // The rear foot rests on the top of the 65 cm ball, not on the floor.
        far: { target: [150, G - BALL.d - A] as Vec2, foot: 0, side: [-1, 0] as Vec2 },
      }
      : standLegs(262),
    arms: {
      near: { a1: near.upper, a2: near.fore, hand: handFor(grip, near.fore, supinate ? pNear : 1) },
      far: { a1: far.upper, a2: far.fore, hand: handFor(grip, far.fore, supinate ? pFar : 1) },
    },
  };
}

function seatedPose(pNear: number, pFar: number, grip: Grip, supinate = false) {
  const near = curl(pNear, 91, 86, -48), far = curl(pFar, 93, 88, -46);
  return {
    hip: [225, G - 103] as Vec2, spine: { lumbar: -91, thoracic: -93 }, neck: -89, head: -90,
    // Thighs rest on the pad and the shins are vertical, with both soles on the floor.
    legs: { near: { a1: 0, a2: 90, foot: 0 }, far: { a1: 0, a2: 90, foot: 0 } },
    arms: {
      near: { a1: near.upper, a2: near.fore, hand: handFor(grip, near.fore, supinate ? pNear : 1) },
      far: { a1: far.upper, a2: far.fore, hand: handFor(grip, far.fore, supinate ? pFar : 1) },
    },
  };
}

function preacherPose(pNear: number, pFar: number, grip: Grip) {
  // The upper arms follow the 45° pad. A 139° direction change gives a 41° top elbow angle.
  const near = curl(pNear, 48, 62, -91), far = curl(pFar, 50, 64, -89);
  return {
    hip: [192, G - 103] as Vec2, spine: { lumbar: -75, thoracic: -78 }, neck: -76, head: -78,
    legs: { near: { a1: 0, a2: 90, foot: 0 }, far: { a1: 0, a2: 90, foot: 0 } },
    arms: {
      near: { a1: near.upper, a2: near.fore, hand: handFor(grip, near.fore) },
      far: { a1: far.upper, a2: far.fore, hand: handFor(grip, far.fore) },
    },
  };
}

function inclinePose(pNear: number, pFar: number, grip: Grip, supinate = false, wristExtension = 0) {
  const near = curl(pNear, 88, 84, -50), far = curl(pFar, 90, 86, -48);
  return {
    hip: [255, G - 103] as Vec2,
    // Back and head stay on the 45° backrest.
    spine: { lumbar: -130, thoracic: -134 }, neck: -132, head: -134,
    legs: { near: { a1: 0, a2: 90, foot: 0 }, far: { a1: 0, a2: 90, foot: 0 } },
    arms: {
      near: { a1: near.upper, a2: near.fore, hand: handFor(grip, near.fore, supinate ? pNear : 1) - wristExtension },
      far: { a1: far.upper, a2: far.fore, hand: handFor(grip, far.fore, supinate ? pFar : 1) - wristExtension },
    },
  };
}

function pronePose(pNear: number, pFar: number, grip: Grip) {
  const near = curl(pNear, 88, 84, -50), far = curl(pFar, 90, 86, -48);
  return {
    // With the athlete facing right, this places the chest—not the back—on the 45° pad.
    hip: [220, 347] as Vec2,
    spine: { lumbar: -45, thoracic: -45 }, neck: -45, head: -45,
    // The legs extend behind the chest support and remain above the floor.
    legs: { near: { a1: 180, a2: 180, foot: 180 }, far: { a1: 180, a2: 180, foot: 180 } },
    arms: {
      near: { a1: near.upper, a2: near.fore, hand: handFor(grip, near.fore) },
      far: { a1: far.upper, a2: far.fore, hand: handFor(grip, far.fore) },
    },
  };
}

function concentrationPose(p: number, grip: Grip) {
  // Leaning forward puts the working elbow just above the near thigh instead of free in space.
  const near = curl(p, 110, 96, -30);
  return {
    hip: [210, G - 103] as Vec2, spine: { lumbar: -25, thoracic: -30 }, neck: -26, head: -30,
    // The spread feet are IK targets, so both soles stay flat.
    legs: {
      near: { target: [323, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
      far: { target: [317, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
    },
    arms: {
      near: { a1: near.upper, a2: near.fore, hand: handFor(grip, near.fore) },
      // The free hand rests against the other inner thigh.
      far: { a1: 94, a2: 80, hand: 80 },
    },
  };
}

function kneelingBallPose(pNear: number, pFar: number, grip: Grip) {
  const near = curl(pNear, 35, 50, -105), far = curl(pFar, 39, 54, -101);
  return {
    hip: [175, G - 96] as Vec2, spine: { lumbar: -45, thoracic: -45 }, neck: -47, head: -45,
    // Both shins contact the floor behind the ball.
    legs: { near: { a1: 90, a2: 180, foot: 180 }, far: { a1: 90, a2: 180, foot: 180 } },
    // Elbows remain on the upper curve of the ball while forearms curl toward the face.
    arms: {
      near: { a1: near.upper, a2: near.fore, hand: handFor(grip, near.fore) },
      far: { a1: far.upper, a2: far.fore, hand: handFor(grip, far.fore) },
    },
  };
}

function supineCablePose(p: number) {
  // Arms stay perpendicular to the torso. The 135° direction change leaves a 45° elbow angle at the chin.
  const fore = lerp(-90, 45, p);
  return {
    hip: [175, G - 112] as Vec2, spine: { lumbar: 0, thoracic: 0 }, neck: 0, head: 0,
    farHip: 0, farShoulder: 0,
    legs: { near: { a1: 0, a2: 90, foot: 0 }, far: { a1: 0, a2: 90, foot: 0 } },
    arms: {
      near: { a1: -90, a2: fore, hand: fore },
      far: { a1: -90, a2: fore, hand: fore },
    },
  };
}

function pressState(t: number): { upper: number; fore: number; biceps: number; delts: number } {
  // Curl, set the elbows beneath the weights, press, then reverse every step.
  if (t < 0.30) {
    const p = t / 0.30;
    return { upper: 91, fore: lerp(86, -48, p), biceps: p, delts: 0.08 };
  }
  if (t < 0.42) {
    const p = (t - 0.30) / 0.12;
    return { upper: lerp(91, 20, p), fore: lerp(-48, -75, p), biceps: 1 - p * 0.45, delts: 0.3 + p * 0.4 };
  }
  if (t < 0.62) {
    const p = (t - 0.42) / 0.20;
    return { upper: lerp(20, -75, p), fore: -75, biceps: 0.2, delts: 0.55 + p * 0.45 };
  }
  if (t < 0.76) {
    const p = (t - 0.62) / 0.14;
    return { upper: lerp(-75, 20, p), fore: -75, biceps: 0.2, delts: 1 - p * 0.45 };
  }
  if (t < 0.88) {
    const p = (t - 0.76) / 0.12;
    return { upper: lerp(20, 91, p), fore: lerp(-75, -48, p), biceps: 0.55 + p * 0.45, delts: 0.35 - p * 0.25 };
  }
  const p = (t - 0.88) / 0.12;
  return { upper: 91, fore: lerp(-48, 86, p), biceps: 1 - p, delts: 0.08 };
}

function curlSquatState(t: number): { curl: number; squat: number; biceps: number; legs: number } {
  const s = t * 4.8;
  if (s < 1.0) return { curl: s, squat: 0, biceps: lerp(0.35, 1, s), legs: 0.08 };
  if (s < 1.35) return { curl: 1, squat: 0, biceps: 1, legs: 0.08 };
  if (s < 2.55) {
    const squat = (s - 1.35) / 1.2;
    return { curl: 1, squat, biceps: 0.7, legs: lerp(0.25, 1, squat) };
  }
  if (s < 2.9) return { curl: 1, squat: 1, biceps: 0.7, legs: 1 };
  if (s < 4.1) {
    const squat = 1 - (s - 2.9) / 1.2;
    return { curl: 1, squat, biceps: 0.68, legs: lerp(1, 0.3, 1 - squat) };
  }
  const curl = 1 - (s - 4.1) / 0.7;
  return { curl, squat: 0, biceps: lerp(1, 0.3, 1 - curl), legs: 0.08 };
}

function curlSquatPose(t: number) {
  const state = curlSquatState(t);
  const travel = Math.sin((state.squat * Math.PI) / 2);
  const sink = 1 - Math.cos((state.squat * Math.PI) / 2);
  const lean = state.squat * 28;
  const near = curl(state.curl, 91, 86, -48);
  const far = curl(state.curl, 93, 88, -46);
  return {
    hip: [lerp(256, 184, travel), lerp(G - A - 183.8, G - A - 104, sink)] as Vec2,
    spine: { lumbar: -89 + lean, thoracic: -91 + lean }, neck: -86 + lean * 0.75, head: -88 + lean * 0.48,
    legs: standLegs(262),
    arms: {
      near: { a1: near.upper, a2: near.fore, hand: handFor('supinated', near.fore) },
      far: { a1: far.upper, a2: far.fore, hand: handFor('supinated', far.fore) },
    },
  };
}

/** Build one accurately differentiated curl from the compact per-file catalog record. */
export function makeBicepsCurl(spec: CurlSpec): SideExercise {
  const grip = spec.grip ?? 'supinated';
  const alternating = spec.alternating ?? false;
  const p = (t: number, side: 'near' | 'far') => alternating ? altAt(t, side).p : pAt(t);
  const biceps = (t: number, side: 'near' | 'far') => alternating ? altAt(t, side).e : eAt(t);
  const tl = alternating ? alternatingTL : normalTL;
  const common = {
    id: spec.id, name: spec.name, tl,
    meta: { en: spec.en, family: 'biceps-curl', equipment: spec.equipment, sources: spec.sources },
  };

  if (spec.mode === 'standing' || spec.mode === 'ball-standing') {
    const parts = [...dumbbellParts(grip), ...(spec.armBlaster ? [armBlaster] : [])];
    return {
      ...common,
      muscles: alternating
        ? [{ m: 'biceps', side: 'near', e: (t) => biceps(t, 'near') }, { m: 'biceps', side: 'far', e: (t) => biceps(t, 'far') }, { m: 'forearms', side: 'both', scale: 0.45 }]
        : [{ m: 'biceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.45 }],
      dynamic: spec.mode === 'ball-standing'
        ? [stabilityBall<Joints>(() => ({ p: [150, G - BALL.r] }), 'back'), ...parts]
        : parts,
      propsBox: spec.mode === 'ball-standing' ? [70, 355] : undefined,
      poster: alternating ? 0.20 : undefined,
      pose: (t) => standingPose(p(t, 'near'), p(t, 'far'), grip, spec.mode === 'ball-standing', spec.supinate),
    };
  }

  if (spec.mode === 'curl-squat') {
    return {
      ...common, tl: { total: 4.8 }, poster: 0.56,
      muscles: [
        { m: 'biceps', side: 'both', e: (t) => curlSquatState(t).biceps },
        { m: 'forearms', side: 'both', scale: 0.45, e: (t) => curlSquatState(t).biceps },
        { m: 'quads', side: 'both', e: (t) => curlSquatState(t).legs },
        { m: 'glutes', scale: 0.6, e: (t) => curlSquatState(t).legs },
      ],
      dynamic: dumbbellParts('supinated'),
      pose: curlSquatPose,
    };
  }

  if (spec.mode === 'seated') {
    const bench = flatBench({ view: 'side', x: 238 });
    return {
      ...common,
      muscles: alternating
        ? [{ m: 'biceps', side: 'near', e: (t) => biceps(t, 'near') }, { m: 'biceps', side: 'far', e: (t) => biceps(t, 'far') }, { m: 'forearms', side: 'both', scale: 0.45 }]
        : [{ m: 'biceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.45 }],
      props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
      dynamic: dumbbellParts(grip), poster: alternating ? 0.20 : undefined,
      pose: (t) => seatedPose(p(t, 'near'), p(t, 'far'), grip, spec.supinate),
    };
  }

  if (spec.mode === 'preacher') {
    const bench = preacherBench({ x: 226, y: 235, angle: 45, seatX: 192 });
    return {
      ...common,
      muscles: alternating
        ? [{ m: 'biceps', side: 'near', e: (t) => biceps(t, 'near') }, { m: 'biceps', side: 'far', e: (t) => biceps(t, 'far') }, { m: 'forearms', side: 'both', scale: 0.45 }]
        : [{ m: 'biceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.45 }],
      props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
      dynamic: dumbbellParts(grip), poster: alternating ? 0.20 : undefined,
      pose: (t) => preacherPose(p(t, 'near'), p(t, 'far'), grip),
    };
  }

  if (spec.mode === 'incline') {
    const bench = inclineBench({ x: 255, angle: 45, facing: 1 });
    return {
      ...common,
      muscles: alternating
        ? [{ m: 'biceps', side: 'near', e: (t) => biceps(t, 'near') }, { m: 'biceps', side: 'far', e: (t) => biceps(t, 'far') }, { m: 'forearms', side: 'both', scale: 0.45 }]
        : [{ m: 'biceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.45 }],
      props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
      dynamic: spec.offsetGrip ? offsetDumbbellParts() : dumbbellParts(grip), poster: alternating ? 0.20 : undefined,
      pose: (t) => inclinePose(p(t, 'near'), p(t, 'far'), grip, spec.supinate, spec.offsetGrip ? 30 : 0),
    };
  }

  if (spec.mode === 'prone') {
    const bench = inclineBench({ x: 230, angle: 45, back: 170, facing: -1 });
    return {
      ...common,
      muscles: [{ m: 'biceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.45 }],
      props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
      dynamic: dumbbellParts(grip),
      pose: (t) => pronePose(pAt(t), pAt(t), grip),
    };
  }

  if (spec.mode === 'concentration') {
    const bench = flatBench({ view: 'side', x: 225 });
    return {
      ...common,
      muscles: [{ m: 'biceps', side: 'near' }, { m: 'forearms', side: 'near', scale: 0.5 }],
      props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
      dynamic: dumbbellParts(grip, false),
      pose: (t) => concentrationPose(pAt(t), grip),
    };
  }

  if (spec.mode === 'ball-kneeling') {
    return {
      ...common,
      muscles: [{ m: 'biceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.45 }],
      dynamic: [stabilityBall<Joints>(() => ({ p: [325, G - BALL.r] }), 'back'), ...dumbbellParts(grip)],
      propsBox: [107, 393],
      pose: (t) => kneelingBallPose(pAt(t), pAt(t), grip),
    };
  }

  if (spec.mode === 'supine-cable') {
    const bench = flatBench({ view: 'side', x: 250 });
    const column = cableColumn({ x: 400, pulleyY: 88, toward: -1 });
    const gripAt = (J: Joints): Vec2 => {
      const hand = J.hand_n;
      const r = hand.a * Math.PI / 180;
      return [J.wrist_n[0] + Math.cos(r) * 9, J.wrist_n[1] + Math.sin(r) * 9];
    };
    return {
      ...common,
      muscles: [{ m: 'biceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.4 }],
      props: (pal) => ({ back: [...bench.draw(pal), ...column.draw(pal)] }),
      propsBox: [bench.box[0], column.box[1]],
      dynamic: [
        cableLine(column.pulley, (J) => gripAt(J)),
        {
          nm: 'Close-Grip Straight Bar', z: 'underNearArm', kind: 'rigid',
          shapes: (pal) => [
            { kind: 'box', nm: 'straight-bar', color: pal.metal, c: [0, 0], s: [50, 5], r: 2.5 },
            { kind: 'box', nm: 'bar-center-eye', color: pal.metalDark, c: [0, -5], s: [8, 7], r: 2 },
          ],
          at: (J) => ({ p: gripAt(J), a: 0 }),
        },
      ],
      pose: (t) => supineCablePose(pAt(t)),
    };
  }

  // Seated curl to shoulder press: a distinct compound movement, not a plain seated curl.
  const bench = flatBench({ view: 'side', x: 238 });
  return {
    ...common, tl: { total: 4.4 }, poster: 0.52,
    muscles: [
      { m: 'biceps', side: 'both', e: (t) => pressState(t).biceps },
      { m: 'delts', side: 'both', e: (t) => pressState(t).delts },
      { m: 'triceps', side: 'both', scale: 0.45, e: (t) => pressState(t).delts },
    ],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: dumbbellParts('supinated'),
    pose: (t) => {
      const a = pressState(t);
      return {
        hip: [225, G - 103] as Vec2, spine: { lumbar: -91, thoracic: -93 }, neck: -89, head: -90,
        legs: { near: { a1: 0, a2: 90, foot: 0 }, far: { a1: 0, a2: 90, foot: 0 } },
        arms: {
          near: { a1: a.upper, a2: a.fore, hand: a.fore },
          far: { a1: a.upper + 2, a2: a.fore + 2, hand: a.fore + 2 },
        },
      };
    },
  };
}
