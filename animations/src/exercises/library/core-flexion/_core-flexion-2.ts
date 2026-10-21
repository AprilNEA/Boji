// Private builders for core-flexion-2. Supine positions use the course crunch contact points.
// The builders keep the pelvis or feet fixed when the source requires it, and put cable lines on their pulleys.
import type { EquipmentTag, PropShape, SideExercise } from '@/exercise.ts';
import { add, dir, lerp, lerpV, mul, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import type { Joints } from '@/rig/side.ts';
import type { Palette } from '@/draw/palettes.ts';
import { A, FLOOR, G, standLegs } from '@/exercises/common.ts';
import { cableColumn, cableHandle, cableLine, dipBars, flatBench, inclineBench, towardCable } from '@/exercises/equipment/index.ts';

type Info = {
  id: string;
  name: string;
  en: string;
  equipment: EquipmentTag[];
  sources: string[];
};
type ArmStyle = 'side' | 'head' | 'overhead' | 'cross';

const repTL = (hold = 0.35) => timeline([
  { d: 1.0, from: 0, to: 1, e: [0.3, 1] },
  { d: hold, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.45, from: 1, to: 0, e: [0.8, 0.3] },
  { d: 0.45, from: 0, to: 0, e: [0.3, 0.25] },
]);

// These are the same contact points as the course crunch: hips and neck base rest on the mat.
const NECK: Vec2 = [150, FLOOR - 18];
const HIP = add(NECK, mul(dir(-3.8), 123.7));
const FLAT = Math.atan2(NECK[1] - HIP[1], NECK[0] - HIP[0]) * (180 / Math.PI);
const ANKLE: Vec2 = [HIP[0] + 106, FLOOR - A];

const infoMeta = (info: Info) => ({ en: info.en, family: 'core-flexion', equipment: info.equipment, sources: info.sources });

function arms(style: ArmStyle, p: number, phi: number) {
  switch (style) {
    case 'side':
      return {
        near: { a1: lerp(8, -14, p), a2: lerp(1, -16, p), hand: lerp(0, -16, p) },
        far: { a1: lerp(7, -15, p), a2: lerp(0, -17, p), hand: lerp(0, -17, p) },
      };
    case 'head':
      // The elbows stay open while both hands remain behind the head.
      return {
        near: { a1: phi + 38, a2: phi - 150, hand: phi - 150 },
        far: { a1: phi + 40, a2: phi - 148, hand: phi - 148 },
      };
    case 'overhead':
      // Straight arms stay aligned with the head and upper torso.
      return {
        near: { a1: phi, a2: phi, hand: phi },
        far: { a1: phi + 2, a2: phi + 2, hand: phi + 2 },
      };
    case 'cross':
      // Folded hands follow the chest through the sit-up, so the arms cannot sweep through the mat.
      return {
        near: { target: (J: Joints) => add(J.B(0.64), [-2, 0]), side: [0, -1] as Vec2, hand: 0 },
        far: { target: (J: Joints) => add(J.B(0.64), [-6, 1]), side: [0, -1] as Vec2, hand: 0 },
      };
  }
}

function floorLegs(kind: 'ground' | 'frog') {
  const ankle: Vec2 = kind === 'frog' ? [HIP[0] + 78, FLOOR - A] : ANKLE;
  return {
    near: { target: ankle, foot: 0, side: [0, -1] as Vec2 },
    far: { target: add(ankle, [-5, 0]), foot: 0, side: [0, -1] as Vec2 },
  };
}

const footAnchor = (pal: Palette): PropShape[] => [
  { kind: 'box' as const, nm: 'foot-anchor-post', color: pal.metalDark, c: [ANKLE[0] + 26, FLOOR - 20], s: [9, 38], r: 3 },
  { kind: 'box' as const, nm: 'foot-anchor-bar', color: pal.metal, c: [ANKLE[0] + 6, FLOOR - 33], s: [49, 9], r: 4 },
];

/** Crunches and sit-ups with the hips and feet grounded throughout. */
export function supineCrunch(
  info: Info,
  opts: { arms: ArmStyle; top?: number; curl?: number; frog?: boolean; anchor?: boolean; secondary?: boolean; slow?: boolean },
): SideExercise {
  // Janda sit-ups require a three-to-six-second ascent. Other sit-ups use a normal controlled repetition.
  const tl = opts.slow ? timeline([
    { d: 3.0, from: 0, to: 1, e: [0.3, 1] },
    { d: 0.4, from: 1, to: 1, e: [1, 0.9] },
    { d: 2.3, from: 1, to: 0, e: [0.8, 0.3] },
    { d: 0.45, from: 0, to: 0, e: [0.3, 0.25] },
  ]) : repTL();
  const isCurl = opts.curl !== undefined;
  const top = opts.top ?? -135;
  // FLAT is about +176°. A negative target is the equivalent screen angle after a forward curl.
  // Unwrap it through +180°, not through 0°, which would rotate the torso down through the floor.
  const forwardTop = top < 0 ? top + 360 : top;
  return {
    id: info.id, name: info.name, tl, mat: true, meta: infoMeta(info),
    muscles: [{ m: 'abs' }, ...(opts.secondary ? [{ m: 'hipFlexor' as const, side: 'both' as const, scale: 0.4 }] : [])],
    ...(opts.anchor ? { props: (pal: Palette) => ({ back: footAnchor(pal) }) } : {}),
    pose(t) {
      const p = tl.at(t).p;
      const phi = isCurl ? FLAT + (opts.curl ?? 31) * p : lerp(FLAT, forwardTop, p);
      return {
        hip: HIP,
        spine: isCurl ? { lumbar: FLAT - 1, thoracic: phi } : { lumbar: phi, thoracic: phi - 2 },
        neck: isCurl ? lerp(182, 222, p) : lerp(182, forwardTop - 4, p),
        head: isCurl ? lerp(181, 225, p) : lerp(181, forwardTop - 2, p),
        legs: floorLegs(opts.frog ? 'frog' : 'ground'),
        arms: arms(opts.arms, p, phi),
      };
    },
  };
}

/** Supine leg lifts: the lower back remains on the mat and only the legs move. */
export function legLift(info: Info, opts: { low: number; high: number; hipCurl?: boolean; bent?: boolean; groundedStart?: boolean; hands?: 'side' | 'head' }): SideExercise {
  const tl = repTL();
  return {
    id: info.id, name: info.name, tl, mat: true, meta: infoMeta(info),
    muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }],
    pose(t) {
      const p = tl.at(t).p, a = lerp(opts.low, opts.high, p);
      const hip = opts.hipCurl ? add(HIP, [-24 * p, -18 * p]) : HIP;
      const spine = opts.hipCurl ? { target: NECK, side: [0, 1] as Vec2 } : { lumbar: FLAT, thoracic: FLAT };
      const shin = opts.bent ? lerp(0, -8, p) : a;
      const legs = opts.groundedStart
        ? {
          // The start has bent knees and flat feet. The end brings the ankles toward the curling pelvis.
          near: { target: (J: Joints) => lerpV(ANKLE, add(J.H, [52, -112]), p), foot: 0, side: [0, -1] as Vec2 },
          far: { target: (J: Joints) => lerpV(add(ANKLE, [-5, 0]), add(J.Hf, [47, -110]), p), foot: 2, side: [0, -1] as Vec2 },
        }
        : { near: { a1: a, a2: shin, foot: opts.bent ? 0 : a }, far: { a1: a + 2, a2: shin + 2, foot: opts.bent ? 2 : a + 2 } };
      return {
        hip, spine, neck: 182, head: 181,
        legs,
        arms: opts.hands === 'head' ? arms('head', p, FLAT) : arms('side', p, FLAT),
      };
    },
  };
}

/** Straight-arm V-up: legs and torso fold toward one another without bending the knees or elbows. */
export function vUp(info: Info): SideExercise {
  const tl = repTL();
  return {
    id: info.id, name: info.name, tl, mat: true, meta: infoMeta(info),
    muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.45 }],
    pose(t) {
      // Both rotations travel through the upward half of the circle, not down through the mat.
      const p = tl.at(t).p, torso = lerp(FLAT, 228, p), leg = lerp(-6, -47, p), arm = lerp(180, 330, p);
      return {
        hip: HIP, spine: { lumbar: torso, thoracic: torso - 2 }, neck: lerp(182, 223, p), head: lerp(181, 225, p),
        legs: { near: { a1: leg, a2: leg, foot: leg }, far: { a1: leg + 2, a2: leg + 2, foot: leg + 2 } },
        arms: { near: { a1: arm, a2: arm, hand: arm }, far: { a1: arm + 2, a2: arm + 2, hand: arm + 2 } },
      };
    },
  };
}

/** Alternating straight legs; both heels remain above the mat. */
export function alternatingKick(info: Info, high: number): SideExercise {
  const phase = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * 2 * t);
  return {
    id: info.id, name: info.name, tl: { total: 1.6 }, mat: true, meta: infoMeta(info),
    muscles: [{ m: 'abs', e: () => 0.72 }, { m: 'hipFlexor', side: 'both', scale: 0.45, e: () => 0.65 }],
    pose(t) {
      const q = phase(t), n = lerp(-7, high, q), f = lerp(-7, high, 1 - q);
      return {
        hip: HIP, spine: { lumbar: FLAT, thoracic: FLAT }, neck: 182, head: 181,
        legs: { near: { a1: n, a2: n, foot: n }, far: { a1: f, a2: f, foot: f } }, arms: arms('side', 0, FLAT),
      };
    },
  };
}

/** A toe toucher keeps vertical legs fixed while the shoulders curl up and straight hands reach to the toes. */
export function toeTouch(info: Info): SideExercise {
  const tl = repTL();
  return {
    id: info.id, name: info.name, tl, mat: true, meta: infoMeta(info), muscles: [{ m: 'abs' }],
    pose(t) {
      const p = tl.at(t).p, phi = FLAT + 34 * p;
      return {
        hip: HIP, spine: { lumbar: FLAT - 1, thoracic: phi }, neck: lerp(182, 224, p), head: lerp(181, 226, p),
        legs: { near: { a1: -88, a2: -88, foot: 0 }, far: { a1: -86, a2: -86, foot: 2 } },
        arms: { near: { a1: -43, a2: -43, hand: -43 }, far: { a1: -41, a2: -41, hand: -41 } },
      };
    },
  };
}

/** Tuck crunch with thighs vertical and calves level; the lower back stays on the mat. */
export function tabletopCrunch(info: Info): SideExercise {
  const tl = repTL();
  return {
    id: info.id, name: info.name, tl, mat: true, meta: infoMeta(info), muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.35 }],
    pose(t) {
      const p = tl.at(t).p, phi = FLAT + 31 * p;
      return {
        hip: HIP, spine: { lumbar: FLAT - 1, thoracic: phi }, neck: lerp(182, 222, p), head: lerp(181, 225, p),
        legs: { near: { a1: -90, a2: 0, foot: 0 }, far: { a1: -88, a2: 2, foot: 2 } }, arms: arms('cross', p, phi),
      };
    },
  };
}

const cableGrip = (J: Joints): Vec2 => J.wrist_n;

/** Kneeling or standing cable crunch. The hip point is fixed while the spine rounds forward. */
export function ropeCrunch(info: Info, position: 'kneel' | 'stand', attachment: 'rope' | 'bar' = 'rope'): SideExercise {
  const tl = repTL();
  const column = cableColumn({ x: 112, pulleyY: 70, toward: 1 });
  // Leave two pixels of knee slack for the far hip, which sits behind the near hip in side view.
  const hip: Vec2 = position === 'kneel' ? [275, G - 96] : [270, G - A - 181];
  const legs = position === 'kneel'
    ? { near: { a1: 90, a2: 180, foot: 180 }, far: { a1: 90, a2: 180, foot: 180 } }
    : standLegs(270, -5);
  return {
    id: info.id, name: info.name, tl, meta: infoMeta(info), propsBox: [column.box[0], 340],
    muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.4 }], props: (pal) => ({ back: column.draw(pal) }),
    dynamic: [cableLine(column.pulley, (J) => cableGrip(J)), cableHandle(attachment, (J) => ({ p: cableGrip(J), a: towardCable(cableGrip(J), column.pulley) }), attachment === 'bar' ? { len: 34 } : {})],
    pose(t) {
      const p = tl.at(t).p, torso = lerp(-90, -42, p);
      return { hip, spine: { lumbar: torso, thoracic: torso - 5 }, neck: torso - 5, head: torso - 3, legs, arms: arms('head', p, torso) };
    },
  };
}

/** Seated cable crunch on a flat bench, facing away from a high pulley. */
export function seatedRopeCrunch(info: Info): SideExercise {
  const tl = repTL(), bench = flatBench({ view: 'side', x: 272, top: 82, length: 180 }), column = cableColumn({ x: 120, pulleyY: 62, toward: 1 });
  const hip: Vec2 = [265, G - 101];
  return {
    id: info.id, name: info.name, tl, meta: infoMeta(info), propsBox: [column.box[0], bench.box[1]], muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.35 }],
    props: (pal) => ({ back: [...column.draw(pal), ...bench.draw(pal)] }),
    dynamic: [cableLine(column.pulley, (J) => cableGrip(J)), cableHandle('rope', (J) => ({ p: cableGrip(J), a: towardCable(cableGrip(J), column.pulley) }))],
    pose(t) {
      const p = tl.at(t).p, torso = lerp(-92, -42, p);
      return {
        hip, spine: { lumbar: torso, thoracic: torso - 4 }, neck: torso - 4, head: torso - 2,
        legs: { near: { target: [hip[0] + 93, G - A], foot: 0, side: [0, -1] }, far: { target: [hip[0] + 88, G - A], foot: 0, side: [0, -1] } }, arms: arms('head', p, torso),
      };
    },
  };
}

/** Reverse crunch while holding a low-pulley cable above the chest. */
export function cableReverse(info: Info): SideExercise {
  const tl = repTL(), column = cableColumn({ x: 438, pulleyY: G - 76, toward: -1 });
  return {
    id: info.id, name: info.name, tl, mat: true, meta: infoMeta(info), propsBox: [90, column.box[1]], muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.45 }],
    props: (pal) => ({ back: column.draw(pal) }),
    dynamic: [cableLine(column.pulley, (J) => cableGrip(J)), cableHandle('bar', (J) => ({ p: cableGrip(J), a: towardCable(cableGrip(J), column.pulley) }), { len: 34 })],
    pose(t) {
      const p = tl.at(t).p, hip = add(HIP, [-23 * p, -17 * p]), thigh = lerp(-90, -140, p);
      return {
        hip, spine: { target: NECK, side: [0, 1] }, neck: 182, head: 181,
        legs: { near: { a1: thigh, a2: 0, foot: 0 }, far: { a1: thigh + 2, a2: 2, foot: 2 } },
        arms: { near: { a1: -90, a2: -90, hand: 0 }, far: { a1: -88, a2: -88, hand: 2 } },
      };
    },
  };
}

/** Incline-bench straight-leg raise. The shoulder blades and hands stay on the bench. */
export function inclineLegRaise(info: Info): SideExercise {
  const tl = repTL(), bench = inclineBench({ x: 265, angle: 25, top: 86, facing: 1, back: 170, seat: 74 });
  const hip: Vec2 = [264, G - 122];
  return {
    id: info.id, name: info.name, tl, meta: infoMeta(info), propsBox: bench.box, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }], props: (pal) => ({ back: bench.draw(pal) }),
    pose(t) {
      const a = lerp(-12, -76, tl.at(t).p);
      return { hip, spine: { lumbar: -156, thoracic: -158 }, neck: -154, head: -152, legs: { near: { a1: a, a2: a, foot: a }, far: { a1: a + 2, a2: a + 2, foot: a + 2 } }, arms: { near: { a1: 12, a2: 12, hand: 12 }, far: { a1: 14, a2: 14, hand: 14 } } };
    },
  };
}

/** Captain's chair leg raise, with forearms supported and the back against the pad. */
export function captainsChair(info: Info): SideExercise {
  const tl = repTL(), station = dipBars({ view: 'side', x: 271, y: 228 });
  const hip: Vec2 = [254, 268];
  return {
    id: info.id, name: info.name, tl, meta: infoMeta(info), propsBox: station.box, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.45 }],
    props: (pal) => ({ back: [...station.draw(pal), { kind: 'box', nm: 'chair-back', color: pal.pad, c: [226, 203], s: [18, 120], r: 7 }, { kind: 'box', nm: 'chair-arm-pad', color: pal.pad, c: [278, 231], s: [72, 15], r: 7 }] }),
    pose(t) {
      const a = lerp(90, 0, tl.at(t).p);
      return { hip, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, legs: { near: { a1: a, a2: a, foot: a }, far: { a1: a + 2, a2: a + 2, foot: a + 2 } }, arms: { near: { a1: 90, a2: 0, hand: 0 }, far: { a1: 90, a2: 0, hand: 0 } } };
    },
  };
}
