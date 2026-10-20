// Private builders for triceps-extension-1. Each builder keeps the prescribed support and upper-arm position fixed.
// The moving segment is the elbow: the forearm opens to a straight lockout, then returns with controlled timing.
import type { EquipmentTag, FrontExercise, Props, SideExercise } from '@/exercise.ts';
import { add, lerp, sub, timeline, type Vec2 } from '@/math.ts';
import { add3, type Vec3 } from '@/math3.ts';
import { project, type FrontJoints } from '@/front-rig.ts';
import type { Joints, LimbPair, Pose } from '@/rig.ts';
import { A, FLOOR, G, GRIP_IN_HAND, plantedArm, standLegs } from '@/exercises/common.ts';
import { HIGH_PLANK } from '@/exercises/push-up.ts';
import { bandLine, barbell, cableColumn, cableHandle, cableLine, declineBench, dumbbell, flatBench, gripAt, inclineBench, towardCable, workTL } from '@/exercises/equipment/index.ts';

const REP = workTL(0.35);
const ALTERNATE = timeline([
  { d: 0.8, from: 0, to: 1, e: [0.35, 1] }, { d: 0.25, from: 1, to: 1, e: [1, 0.85] },
  { d: 0.8, from: 1, to: 0, e: [0.85, 0.4] }, { d: 0.25, from: 0, to: 0, e: [0.4, 0.35] },
]);
const FLAT = flatBench({ view: 'side', x: 232 });
const INCLINE = inclineBench({ x: 238, angle: 55, back: 165, seat: 74 });
const DECLINE = declineBench({ x: 96, angle: 20, low: 72, length: 215 });
const UPRIGHT = inclineBench({ x: 232, angle: 90, back: 156, seat: 76 });

type Support = 'flat' | 'incline' | 'decline';
type Lower = 'forehead' | 'behind';
export interface BasicSpec { id: string; name: string; en: string; sources: string[]; }

function benchFor(support: Support) {
  return support === 'flat' ? FLAT : support === 'incline' ? INCLINE : DECLINE;
}

function benchBase(support: Support): Omit<Pose, 'arms'> {
  if (support === 'flat') return {
    hip: [238, FLAT.seatY - 18], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    farHip: 0, farShoulder: 0,
    legs: { near: { target: [350, G - A], foot: 0, side: [0, -1] }, far: { target: [344, G - A], foot: 0, side: [0, -1] } },
  };
  if (support === 'incline') return {
    hip: [238, INCLINE.seatY - 18], spine: { lumbar: -135, thoracic: -135 }, neck: -135, head: -135,
    farHip: 0, farShoulder: 0,
    legs: { near: { target: [348, G - A], foot: 0, side: [0, -1] }, far: { target: [342, G - A], foot: 0, side: [0, -1] } },
  };
  return {
    hip: [206, 326], spine: { lumbar: 160, thoracic: 160 }, neck: 160, head: 160,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { target: [DECLINE.roller[0], DECLINE.roller[1] + 5], foot: -25, side: [0, 1] },
      far: { target: [DECLINE.roller[0] - 4, DECLINE.roller[1] + 4], foot: -25, side: [0, 1] },
    },
  };
}

function benchProps(support: Support): (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => Props {
  const b = benchFor(support);
  return (pal) => ({ back: b.draw(pal) });
}

/** Fixed upper arms make the skull-crusher variants read as elbow extension rather than a press. */
export function barbellExtension(spec: BasicSpec & { support?: Support; lower?: Lower; reverse?: boolean }): SideExercise {
  const support = spec.support ?? 'flat';
  // On the incline bench, the humeri follow the torso overhead and the forearms fold behind the head.
  const upper = support === 'incline' ? -135 : support === 'decline' ? -72 : -80;
  const lower = support === 'incline' ? 90 : spec.lower === 'behind' ? 160 : 145;
  const bench = benchFor(support);
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['barbell', 'bench'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'forearms', side: 'both', scale: spec.reverse ? 0.45 : 0.3 }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: benchProps(support), propsBox: bench.box,
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    poster: 0.3,
    pose(t) {
      const fore = lerp(lower, upper, REP.at(t).p);
      const arms = {
        near: { a1: upper, a2: fore, hand: fore },
        far: { a1: upper, a2: fore, hand: fore },
      };
      return { ...benchBase(support), arms };
    },
  } satisfies SideExercise;
}

/** The JM press starts above the upper chest, flexes like an extension, then lets the upper arms move slightly toward the legs. */
export function jmPress(spec: BasicSpec): SideExercise {
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['barbell', 'bench'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.4 }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: benchProps('flat'), propsBox: FLAT.box,
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.3,
    pose(t) {
      const p = REP.at(t).p;
      return {
        ...benchBase('flat'),
        arms: {
          near: { target: (J) => add(J.S, [lerp(54, 35, p), lerp(-62, -120.8, p)]), side: [0, 1], hand: -90 },
          far: { target: (J) => add(J.Sf, [lerp(54, 35, p), lerp(-62, -120.8, p)]), side: [0, 1], hand: -90 },
        },
      };
    },
  } satisfies SideExercise;
}

/** A Tate press keeps the humerus nearly vertical while both dumbbells arc inward to the upper chest. */
export function tatePress(spec: BasicSpec): SideExercise {
  const upper = -78, lower = 35;
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.4 }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: benchProps('flat'), propsBox: FLAT.box,
    dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')], poster: 0.3,
    pose(t) {
      const fore = lerp(lower, upper, REP.at(t).p);
      return { ...benchBase('flat'), arms: { near: { a1: upper, a2: fore, hand: fore }, far: { a1: upper, a2: fore, hand: fore } } };
    },
  } satisfies SideExercise;
}

/** The source calls for one dumbbell held with both hands, so the visible weight stays centered at the joined grips. */
export function dumbbellLyingExtension(spec: BasicSpec): SideExercise {
  const upper = -80, lower = 160;
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: benchProps('flat'), propsBox: FLAT.box,
    dynamic: [dumbbell('n', 'profile')], poster: 0.3,
    pose(t) {
      const fore = lerp(lower, upper, REP.at(t).p);
      return { ...benchBase('flat'), arms: { near: { a1: upper, a2: fore, hand: fore }, far: { a1: upper, a2: fore, hand: fore } } };
    },
  } satisfies SideExercise;
}

function standingBase(): Omit<Pose, 'arms'> {
  return { hip: [267, G - A - 183.7], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, legs: standLegs(267, -8) };
}
function seatedBase(): Omit<Pose, 'arms'> {
  return {
    hip: [238, G - 104], spine: { lumbar: -91, thoracic: -93 }, neck: -90, head: -89,
    legs: { near: { target: [338, G - A], foot: 0, side: [0, -1] }, far: { target: [332, G - A], foot: 0, side: [0, -1] } },
  };
}
function uprightProps(pal: Parameters<NonNullable<SideExercise['props']>>[0]): Props { return { back: UPRIGHT.draw(pal) }; }

/** Overhead variants retain vertical humeri; the bar or handle travels only around the elbows behind the head. */
export function overheadExtension(spec: BasicSpec & { support: 'standing' | 'seated'; resistance: 'barbell' | 'band' | 'cable'; rope?: boolean }): SideExercise {
  const upper = -92, lower = 155;
  const base = spec.support === 'standing' ? standingBase : seatedBase;
  const equipment: EquipmentTag[] = spec.resistance === 'barbell' ? (spec.support === 'seated' ? ['barbell', 'bench'] : ['barbell'])
    : spec.resistance === 'band' ? ['band'] : ['cable'];
  const tower = cableColumn({ x: 104, pulleyY: 116, toward: 1 });
  const anchor: Vec2 = [216, G - 7];
  const dynamic: SideExercise['dynamic'] = spec.resistance === 'barbell'
    ? [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })]
    : spec.resistance === 'band'
      ? [bandLine<Joints>((J) => [anchor, gripAt(J, 'n')], 'underNearArm', 'ground-anchored-band')]
      : [
        cableLine(tower.pulley, (J) => gripAt(J, 'n'), 'high-pulley-cable'),
        cableHandle(spec.rope ? 'rope' : 'end', (J) => { const g = gripAt(J, 'n'); return { p: g, a: towardCable(g, tower.pulley) }; }),
      ];
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment, sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: [...(spec.support === 'seated' ? UPRIGHT.draw(pal) : []), ...(spec.resistance === 'cable' ? tower.draw(pal) : []), ...(spec.resistance === 'band' ? [{ kind: 'box' as const, nm: 'band-anchor', color: pal.metalDark, c: anchor, s: [22, 10] as Vec2, r: 3 }] : [])] }),
    propsBox: spec.resistance === 'cable' ? [tower.box[0], spec.support === 'standing' ? 360 : UPRIGHT.box[1]] : spec.support === 'seated' ? UPRIGHT.box : [210, 360],
    dynamic, poster: 0.3,
    pose(t) {
      const fore = lerp(lower, upper, REP.at(t).p);
      return { ...base(), arms: { near: { a1: upper, a2: fore, hand: fore }, far: { a1: upper, a2: fore, hand: fore } } };
    },
  } satisfies SideExercise;
}

/** The band skull crusher is a flat-bench elbow extension with the band anchored below and behind the head. */
export function bandSkullCrusher(spec: BasicSpec): SideExercise {
  const anchor: Vec2 = [FLAT.box[0] + 18, G - 8], upper = -80, lower = 160;
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['band', 'bench'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }], props: (pal) => ({ back: [...FLAT.draw(pal), { kind: 'box', nm: 'band-anchor', color: pal.metalDark, c: anchor, s: [22, 10], r: 3 }] }), propsBox: FLAT.box,
    dynamic: [bandLine<Joints>((J) => [anchor, gripAt(J, 'n')], 'underNearArm', 'bench-band')], poster: 0.3,
    pose(t) { const fore = lerp(lower, upper, REP.at(t).p); return { ...benchBase('flat'), arms: { near: { a1: upper, a2: fore, hand: fore }, far: { a1: upper, a2: fore, hand: fore } } }; },
  } satisfies SideExercise;
}

/** Pushdowns keep the upper arms beside the ribs; only the forearms sweep from forward-up to vertical-down. */
export function cablePushdown(spec: BasicSpec & { reverse?: boolean }): SideExercise {
  // The side-view figure faces screen right, so a facing-the-machine pushdown needs the column at screen right.
  const tower = cableColumn({ x: 404, pulleyY: 104, toward: -1 });
  const upper = 82, start = -8;
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['cable'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'forearms', side: 'both', scale: spec.reverse ? 0.45 : 0.25 }],
    props: (pal) => ({
      back: tower.draw(pal),
      // The arm blaster appears only on the named reverse-grip variation and braces the upper arm visibly.
      front: spec.reverse ? [
        { kind: 'poly', nm: 'arm-blaster-frame', color: pal.metal, pts: [[260, 181], [273, 178], [301, 246], [287, 251]] },
        { kind: 'box', nm: 'arm-blaster-pad', color: pal.pad, c: [294, 239], s: [26, 8], r: 4, rot: 82 },
      ] : [],
    }), propsBox: [180, tower.box[1]], poster: 0.3,
    dynamic: [
      cableLine(tower.pulley, (J) => gripAt(J, 'n'), 'pushdown-cable'),
      cableHandle('end', (J) => { const g = gripAt(J, 'n'); return { p: g, a: towardCable(g, tower.pulley) }; }),
    ],
    pose(t) {
      const fore = lerp(start, upper, REP.at(t).p);
      return { ...standingBase(), arms: { near: { a1: upper, a2: fore, hand: fore }, far: { a1: upper, a2: fore, hand: fore } } };
    },
  } satisfies SideExercise;
}

/** Alternating single-arm cable extensions show one elbow straightening while the other arm remains flexed. */
export function cableAlternating(spec: BasicSpec): SideExercise {
  // The shoulder-height pulley stays in front of the athlete who faces the cable machine.
  const tower = cableColumn({ x: 430, pulleyY: 165, toward: -1 });
  const phase = (t: number) => (1 - Math.cos(2 * Math.PI * t)) / 2;
  return {
    id: spec.id, name: spec.name, tl: ALTERNATE,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['cable'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: tower.draw(pal) }), propsBox: [180, tower.box[1]], poster: 0.25,
    dynamic: [
      cableLine(tower.pulley, (J) => gripAt(J, 'n'), 'alternating-cable-near'),
      cableHandle('d', (J) => { const g = gripAt(J, 'n'); return { p: g, a: towardCable(g, tower.pulley) }; }),
    ],
    pose(t) {
      const pn = phase(t), pf = 1 - pn;
      const upper = 0, bent = 92;
      return {
        ...standingBase(),
        arms: { near: { a1: upper, a2: lerp(bent, upper, pn), hand: upper }, far: { a1: upper, a2: lerp(bent, upper, pf), hand: upper } },
      };
    },
  } satisfies SideExercise;
}

/** Cable lying extensions duplicate the bench skull-crusher joint path, with the rope running to the low pulley by the head. */
export function cableLying(spec: BasicSpec): SideExercise {
  const tower = cableColumn({ x: 72, pulleyY: G - 88, toward: 1 });
  const upper = -80, lower = 150;
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['cable', 'bench'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [...FLAT.draw(pal), ...tower.draw(pal)] }), propsBox: [tower.box[0], FLAT.box[1]], poster: 0.3,
    dynamic: [cableLine(tower.pulley, (J) => gripAt(J, 'n'), 'low-cable'), cableHandle('rope', (J) => { const g = gripAt(J, 'n'); return { p: g, a: towardCable(g, tower.pulley) }; })],
    pose(t) { const fore = lerp(lower, upper, REP.at(t).p); return { ...benchBase('flat'), arms: { near: { a1: upper, a2: fore, hand: fore }, far: { a1: upper, a2: fore, hand: fore } } }; },
  } satisfies SideExercise;
}

/** Incline cable extensions use the documented high pulley and a narrow straight-bar path above the inclined torso. */
export function cableIncline(spec: BasicSpec): SideExercise {
  const tower = cableColumn({ x: 82, pulleyY: 112, toward: 1 });
  const upper = -112, lower = 145;
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['cable', 'bench'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [...INCLINE.draw(pal), ...tower.draw(pal)] }), propsBox: [tower.box[0], INCLINE.box[1]], poster: 0.3,
    dynamic: [cableLine(tower.pulley, (J) => gripAt(J, 'n'), 'incline-cable'), cableHandle('end', (J) => { const g = gripAt(J, 'n'); return { p: g, a: towardCable(g, tower.pulley) }; })],
    pose(t) { const fore = lerp(lower, upper, REP.at(t).p); return { ...benchBase('incline'), arms: { near: { a1: upper, a2: fore, hand: fore }, far: { a1: upper, a2: fore, hand: fore } } }; },
  } satisfies SideExercise;
}

/** A seated concentration extension keeps the near elbow braced on the inner knee while a low cable moves the hand. */
export function cableConcentration(spec: BasicSpec): SideExercise {
  const tower = cableColumn({ x: 96, pulleyY: G - 82, toward: 1 });
  const chair: Props['back'] = [{ kind: 'box', nm: 'chair-seat', color: '#68717e', c: [238, G - 90], s: [94, 15], r: 6 }, { kind: 'box', nm: 'chair-leg', color: '#4f5864', c: [238, G - 45], s: [10, 76], r: 3 }];
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['cable', 'chair'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'near' }, { m: 'forearms', side: 'near', scale: 0.4 }],
    props: (pal) => ({ back: [...tower.draw(pal), ...chair] }), propsBox: [tower.box[0], 370], poster: 0.3,
    dynamic: [cableLine(tower.pulley, (J) => gripAt(J, 'n'), 'concentration-cable'), cableHandle('d', (J) => { const g = gripAt(J, 'n'); return { p: g, a: towardCable(g, tower.pulley) }; })],
    pose(t) {
      const fore = lerp(145, 56, REP.at(t).p);
      const base = seatedBase();
      return { ...base, arms: { near: { a1: 56, a2: fore, hand: fore }, far: { a1: 55, a2: 105, hand: 105 } } };
    },
  } satisfies SideExercise;
}

function kneelingBase(): Omit<Pose, 'arms'> {
  return {
    hip: [266, FLOOR - 105], spine: { lumbar: -90, thoracic: -92 }, neck: -90, head: -90, farHip: 0, farShoulder: 0,
    legs: { near: { a1: 90, a2: 180, foot: 180 }, far: { a1: 90, a2: 180, foot: 180 } },
  };
}

/** Kneeling rope extension keeps both knees grounded and both upper arms beside the head. */
export function cableKneeling(spec: BasicSpec): SideExercise {
  const tower = cableColumn({ x: 404, pulleyY: 126, toward: -1 });
  const upper = -88, lower = 155;
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['cable'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: tower.draw(pal) }), propsBox: [155, tower.box[1]], poster: 0.3,
    dynamic: [cableLine(tower.pulley, (J) => gripAt(J, 'n'), 'kneeling-cable'), cableHandle('rope', (J) => { const g = gripAt(J, 'n'); return { p: g, a: towardCable(g, tower.pulley) }; })],
    pose(t) { const fore = lerp(lower, upper, REP.at(t).p); return { ...kneelingBase(), arms: { near: { a1: upper, a2: fore, hand: fore }, far: { a1: upper, a2: fore, hand: fore } } }; },
  } satisfies SideExercise;
}

/** Bench-supported kneeling cable extensions place the upper arms on the pad and send the bar forward from the elbows. */
export function cableKneelingBench(spec: BasicSpec): SideExercise {
  const tower = cableColumn({ x: 84, pulleyY: 112, toward: 1 });
  const bench = flatBench({ view: 'side', x: 270, top: 132, length: 152 });
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['cable', 'bench'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }],
    props: (pal) => ({ back: [...tower.draw(pal), ...bench.draw(pal)] }), propsBox: [tower.box[0], bench.box[1]], poster: 0.3,
    dynamic: [cableLine(tower.pulley, (J) => gripAt(J, 'n'), 'bench-supported-cable'), cableHandle('end', (J) => { const g = gripAt(J, 'n'); return { p: g, a: towardCable(g, tower.pulley) }; })],
    pose(t) {
      const fore = lerp(-135, 0, REP.at(t).p);
      const base = { ...kneelingBase(), hip: [244, FLOOR - 105], spine: { lumbar: -25, thoracic: -22 }, neck: -15, head: -12 } as Omit<Pose, 'arms'>;
      return { ...base, arms: { near: { a1: 0, a2: fore, hand: fore }, far: { a1: 0, a2: fore, hand: fore } } };
    },
  } satisfies SideExercise;
}

/** The high-plank variation keeps the body rigid and emphasizes elbow extension close to the ribs. */
export function tricepsPushUp(spec: BasicSpec): SideExercise {
  // HIGH_PLANK.top preserves the normal push-up reach. This triceps lockout needs 0.9° more body elevation.
  const top = HIGH_PLANK.top - 0.9;
  return {
    id: spec.id, name: spec.name, tl: REP, mat: true,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['bodyweight'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.4 }, { m: 'abs', scale: 0.4 }], poster: 0.3,
    pose(t) {
      const p = REP.at(t).p;
      return {
        ...HIGH_PLANK.body(lerp(HIGH_PLANK.bottom, top, p)),
        arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) },
      };
    },
  } satisfies SideExercise;
}

/** The bar variation uses planted hands on a chest-height fixed bar, so the elbows close and open while the body stays straight. */
export function bodyweightBar(spec: BasicSpec): SideExercise {
  const barX = 386, barY = 310;
  const barProps: Props['back'] = [{ kind: 'box', nm: 'bar-rack-post', color: '#56606b', c: [barX + 48, (barY + G) / 2], s: [12, G - barY], r: 3 }, { kind: 'box', nm: 'fixed-bar', color: '#a6b0bb', c: [barX, barY], s: [112, 10], r: 4 }];
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['bodyweight'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'abs', scale: 0.35 }], props: () => ({ back: barProps }), propsBox: [5, 450], poster: 0.3,
    pose(t) {
      const p = REP.at(t).p;
      const ankle: Vec2 = [25, FLOOR - 41];
      const th = lerp(-13, -31, p);
      const hip = add(ankle, [181 * Math.cos(th * Math.PI / 180), 181 * Math.sin(th * Math.PI / 180)]);
      const wrist: Vec2 = [barX, barY];
      return {
        hip, farHip: 0, farShoulder: 0, spine: { lumbar: th, thoracic: th - 1 }, neck: th - 4, head: th + 2,
        legs: { near: { target: ankle, side: [0, 1], foot: 85 }, far: { target: add(ankle, [-2, 0]), side: [0, 1], foot: 85 } },
        arms: { near: { target: wrist, side: [0, 1], hand: 0 }, far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [0, 1], hand: 0 } },
      };
    },
  } satisfies SideExercise;
}

/** Body-ups transition from a forearm plank to a high plank while the torso remains one straight line. */
export function bodyUp(spec: BasicSpec): SideExercise {
  const foot: Vec2 = [142, FLOOR - 41];
  const body = (th: number): Omit<Pose, 'arms'> => ({
    hip: add(foot, [181 * Math.cos(th * Math.PI / 180), 181 * Math.sin(th * Math.PI / 180)]), farHip: 0, farShoulder: 0,
    spine: { lumbar: th, thoracic: th - 1 }, neck: th - 4, head: th + 2,
    legs: { near: { target: foot, side: [0, 1], foot: 85 }, far: { target: add(foot, [-2, 0]), side: [0, 1], foot: 85 } },
  });
  return {
    id: spec.id, name: spec.name, tl: REP, mat: true,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['bodyweight'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'abs', scale: 0.5 }, { m: 'forearms', side: 'both', scale: 0.3 }], poster: 0.3,
    pose(t) {
      const p = REP.at(t).p;
      // The forearm-plank shoulder is high enough for the elbow and wrist to clear the mat.
      const th = lerp(-12, -25, p);
      const topArm = 78;
      const fore = lerp(0, topArm, p);
      return { ...body(th), arms: { near: { a1: lerp(90, topArm, p), a2: fore, hand: fore }, far: { a1: lerp(90, topArm, p), a2: fore, hand: fore } } };
    },
  } satisfies SideExercise;
}

/** Front-facing band extensions make the horizontal upper arms and outward elbow opening unambiguous. */
export function bandSide(spec: BasicSpec): FrontExercise {
  const phase = REP;
  const hand = (J: FrontJoints, s: 'l' | 'r', p: number): Vec3 => {
    const sign = s === 'l' ? 1 : -1;
    return p > 0.5 ? add3(J[`shoulder_${s}`], [sign * 125, 0, 0]) : add3(J[`shoulder_${s}`], [sign * 38, -4, 20]);
  };
  return {
    id: spec.id, name: spec.name, view: 'front', tl: phase,
    meta: { en: spec.en, family: 'triceps-extension', equipment: ['band'], sources: spec.sources },
    muscles: [{ m: 'triceps', side: 'both', region: { view: 'front', part: 'upper', c: [0, 31], s: [11, 36] } }, { m: 'delts', side: 'both', scale: 0.35 }],
    dynamic: [bandLine<FrontJoints>((J, t) => [project(hand(J, 'r', phase.at(t).p)), project(hand(J, 'l', phase.at(t).p))], 'underNearArm', 'side-extension-band')],
    poster: 0.3,
    pose(t) {
      const p = phase.at(t).p;
      return {
        pelvis: [0, A + 183, 0], legs: { l: { target: [18, A, 2] }, r: { target: [-18, A, 2] } },
        arms: {
          l: { target: (J) => hand(J, 'l', p), pole: [0, 0, -1] },
          r: { target: (J) => hand(J, 'r', p), pole: [0, 0, -1] },
        },
      };
    },
  } satisfies FrontExercise;
}
