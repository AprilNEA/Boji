// Family-local builders keep repeated shoulder-rotation geometry consistent.
// Front poses use the visible frontal arc while preserving the fixed elbow or fixed standing base.
import type { FrontExercise, SideExercise } from '@/exercise.ts';
import { add, addScaled, dir, lerp, mul } from '@/math/vec2.ts';
import { add3 } from '@/math/vec3.ts';
import { BODY, GROUND, solve, type Joints, type Pose } from '@/rig/side.ts';
import type { FrontJoints } from '@/rig/front.ts';
import { cableColumn, cableHandle, cableLine, frontDumbbell, frontGripAt, heldPlate, towardCable, workTL, bandLine, barbell, dumbbell, flatBench, inclineBench, pullUpBar, smithRails, gripAt } from '@/exercises/equipment/index.ts';
import { A, G, hipForShoulder, plantedArm, standLegs, HIGH_PLANK } from '@/exercises/common.ts';
import { inclinePose, inclineStep } from '@/exercises/library/push-up/_push-up-1.ts';

const STAND_Y = BODY.ankleH + BODY.thigh + BODY.shin;
const legs = {
  l: { target: [17, BODY.ankleH, 2] as [number, number, number] },
  r: { target: [-17, BODY.ankleH, 2] as [number, number, number] },
};

function restingArm(side: 'l' | 'r') {
  return { target: (J: FrontJoints) => add3(J[`shoulder_${side}`], [0, -121, 8]) };
}

/** Elbow stays beside the ribs at about 90 degrees while the forearm rotates across the torso. */
export function tuckedRotation(spec: {
  id: string; name: string; en: string; sources: string[]; device: 'band' | 'cable'; external: boolean;
}): FrontExercise {
  const tl = workTL(0.35);
  const tower = cableColumn({ x: -172, pulleyY: 198, toward: 1 });
  const start = spec.external ? 58 : -58;
  const end = spec.external ? -58 : 58;
  const hand = (J: FrontJoints, t: number) => [
    J.shoulder_r[0] + lerp(start, end, tl.at(t).p), J.shoulder_r[1] - BODY.upper, 8,
  ] as [number, number, number];
  const dynamic = spec.device === 'cable'
    ? [
      cableLine<FrontJoints>(tower.pulley, (J, t) => frontGripAt(J, 'r'), 'Elbow-height cable'),
      cableHandle<FrontJoints>('d', (J, t) => {
        const grip = frontGripAt(J, 'r');
        return { p: grip, a: towardCable(grip, tower.pulley) };
      }),
    ]
    : [bandLine<FrontJoints>((J, t) => [[-151, 198], frontGripAt(J, 'r')], 'back', 'Elbow-height band')];
  return {
    id: spec.id, name: spec.name, view: 'front', tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: [spec.device], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'r' }, { m: 'forearms', side: 'r', scale: 0.35 }],
    props: (pal) => spec.device === 'cable'
      ? { back: tower.draw(pal) }
      : { back: [
        { kind: 'box', nm: 'band-post', color: pal.prop, c: [-170, 255], s: [20, 390], r: 5 },
        { kind: 'box', nm: 'band-anchor', color: pal.metal, c: [-151, 198], s: [12, 12], r: 6 },
      ] },
    propsBox: spec.device === 'cable' ? [tower.box[0], 148] : [-184, 148],
    dynamic,
    poster: 0.31,
    pose(t) {
      return {
        pelvis: [0, STAND_Y, 0], legs,
        arms: {
          // The downward pole fixes the upper arm beside the ribs. Only the 90-degree forearm sweeps.
          r: { target: (J) => hand(J, t), pole: [0, -1, 0] },
          l: restingArm('l'),
        },
      };
    },
  };
}

/** Cable variation with an extended arm: the hand arcs outward while the shoulder stays level. */
export function cableExtendedExternal(spec: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const tl = workTL(0.35);
  const tower = cableColumn({ x: -182, pulleyY: 142, toward: 1 });
  return {
    id: spec.id, name: spec.name, view: 'front', tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['cable'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'r' }, { m: 'forearms', side: 'r', scale: 0.3 }],
    props: (pal) => ({ back: tower.draw(pal) }), propsBox: [tower.box[0], 156], poster: 0.3,
    dynamic: [
      cableLine<FrontJoints>(tower.pulley, (J) => frontGripAt(J, 'r'), 'Shoulder-height cable'),
      cableHandle<FrontJoints>('d', (J) => {
        const grip = frontGripAt(J, 'r');
        return { p: grip, a: towardCable(grip, tower.pulley) };
      }),
    ],
    pose(t) {
      const p = tl.at(t).p;
      return {
        pelvis: [0, STAND_Y, 0], legs,
        arms: {
          // The arm remains long: it starts forward at shoulder height and opens in the transverse plane.
          r: { target: (J) => add3(J.shoulder_r, [lerp(0, -120, p), 0, lerp(124, 22, p)]), pole: (J) => add3(J.shoulder_r, [0, -30, 40]) },
          l: restingArm('l'),
        },
      };
    },
  };
}

/** Both hands pull a band from the thighs into an overhead Y without shrugging. */
export function bandYRaise(spec: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const tl = workTL(0.35);
  return {
    id: spec.id, name: spec.name, view: 'front', tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['band'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'traps', scale: 0.45 }], poster: 0.32,
    dynamic: [
      bandLine<FrontJoints>((J) => [[19, GROUND - BODY.ankleH], frontGripAt(J, 'l')], 'underNearArm', 'Left band strand'),
      bandLine<FrontJoints>((J) => [[-19, GROUND - BODY.ankleH], frontGripAt(J, 'r')], 'underNearArm', 'Right band strand'),
    ],
    pose(t) {
      const p = tl.at(t).p;
      const arm = (s: 1 | -1) => ({ target: (J: FrontJoints) => add3(
        s === 1 ? J.shoulder_l : J.shoulder_r,
        [s * lerp(9, 70, p), lerp(-118, 97, p), lerp(8, 18, p)],
      ) });
      return {
        pelvis: [0, STAND_Y, 0], legs,
        arms: { l: arm(1), r: arm(-1) },
        shoulders: { l: { up: 2 * p }, r: { up: 2 * p } },
      };
    },
  };
}

/** Cuban press: externally rotate at shoulder height first, then press the dumbbells overhead. */
export function cubanPress(spec: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const tl = workTL(0.4);
  return {
    id: spec.id, name: spec.name, view: 'front', tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['dumbbell'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.45, region: { view: 'front', part: 'upper', c: [0, 35], s: [11, 29] } }, { m: 'traps', scale: 0.35 }],
    dynamic: [frontDumbbell('l', 'profile'), frontDumbbell('r', 'profile')], poster: 0.32,
    pose(t) {
      const p = tl.at(t).p;
      const rotate = Math.min(1, p * 2);
      const press = Math.max(0, (p - 0.5) * 2);
      const arm = (s: 1 | -1) => ({ target: (J: FrontJoints) => {
        const shoulder = s === 1 ? J.shoulder_l : J.shoulder_r;
        const elbowX = shoulder[0] + s * 57;
        const elbowY = shoulder[1] - 2;
        const rotated: [number, number, number] = [elbowX, lerp(elbowY - 58, elbowY + 58, rotate), 26];
        return [lerp(rotated[0], shoulder[0] + s * 22, press), lerp(rotated[1], shoulder[1] + 119, press), lerp(rotated[2], 18, press)] as [number, number, number];
      }, pole: [s * 52, -8, 48] as [number, number, number] });
      return { pelvis: [0, STAND_Y, 0], legs, arms: { l: arm(1), r: arm(-1) } };
    },
  };
}

/** At shoulder height, both forearms rotate upward with the upper arms held level. */
export function standingDumbbellExternal(spec: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const tl = workTL(0.35);
  return {
    id: spec.id, name: spec.name, view: 'front', tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['dumbbell'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'traps', scale: 0.35 }],
    dynamic: [frontDumbbell('l', 'end'), frontDumbbell('r', 'end')], poster: 0.31,
    pose(t) {
      const p = tl.at(t).p;
      const raise = Math.min(1, p * 2);
      const rotate = Math.max(0, (p - 0.5) * 2);
      const arm = (s: 1 | -1) => ({ target: (J: FrontJoints) => {
        const shoulder = s === 1 ? J.shoulder_l : J.shoulder_r;
        const elbow: [number, number, number] = [shoulder[0] + s * 57, shoulder[1] - 2, 22];
        const raised: [number, number, number] = [elbow[0], lerp(elbow[1] - 60, elbow[1] + 56, rotate), 22];
        const low: [number, number, number] = [shoulder[0] + s * 9, shoulder[1] - 119, 12];
        return [lerp(low[0], raised[0], raise), lerp(low[1], raised[1], raise), lerp(low[2], raised[2], raise)] as [number, number, number];
      }, pole: [s * 55, -8, 44] as [number, number, number] });
      return { pelvis: [0, STAND_Y, 0], legs, arms: { l: arm(1), r: arm(-1) } };
    },
  };
}

/** Arms stay long at shoulder height while the plate turns from one steering lock to the other. */
export function steeringWheel(spec: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const tl = workTL(0.25);
  const plateAngle = (t: number) => lerp(-34, 34, tl.at(t).p);
  return {
    id: spec.id, name: spec.name, view: 'front', tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['plate'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.6 }], poster: 0.3,
    dynamic: [heldPlate<FrontJoints>((_J, t) => ({ p: [0, 158], a: plateAngle(t) }), 'face', 'medium', 'front', 'Steering plate')],
    pose(t) {
      const a = plateAngle(t) * Math.PI / 180;
      const hand = (s: 1 | -1) => ({ target: (J: FrontJoints) => [
        s * 49 * Math.cos(a), (s === 1 ? J.shoulder_l : J.shoulder_r)[1] - 24 + s * 49 * Math.sin(a), 108,
      ] as [number, number, number] });
      return { pelvis: [0, STAND_Y, 0], legs, arms: { l: hand(1), r: hand(-1) } };
    },
  };
}

/** On a flat bench, the upper arm lies beside the torso while the forearm rotates upward. */
export function sideLyingExternal(spec: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const tl = workTL(0.5);
  const bench = flatBench({ view: 'side', x: 265, top: 140, length: 310 });
  return {
    id: spec.id, name: spec.name, tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['dumbbell', 'bench'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'near' }, { m: 'forearms', side: 'near', scale: 0.35 }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box, poster: 0.31,
    dynamic: [dumbbell('n', 'profile')],
    pose(t) {
      const fore = lerp(88, -86, tl.at(t).p);
      return {
        hip: [275, bench.seatY - 40], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
        farHip: 0, farShoulder: 0,
        legs: { near: { a1: 0, a2: 0, foot: 0 }, far: { a1: 0, a2: 0, foot: 0 } },
        arms: {
          near: { a1: 0, a2: fore, hand: fore },
          far: { a1: 0, a2: 90, hand: 90 },
        },
      };
    },
  };
}

type InclineLoad = 'barbell' | 'dumbbell';
const inclineBase = (lift: number): Pose => ({
  hip: [278, G - 104 - lift], spine: { lumbar: -135, thoracic: -135 }, neck: -135, head: -135,
  legs: {
    near: { target: [366, G - A], foot: 0, side: [0, -1] },
    far: { target: [360, G - A], foot: 0, side: [0, -1] },
  },
  arms: {
    near: { target: (J) => add(J.S, [0, -124]), side: [-1, 0], hand: -90 },
    far: { target: (J) => add(J.Sf, [0, -124]), side: [-1, 0], hand: -90 },
  },
});

/** Locked elbows stay nearly vertical while the shoulders lift the load a few centimetres from the incline pad. */
export function inclineScapularRaise(spec: { id: string; name: string; en: string; sources: string[]; load: InclineLoad; smith?: boolean }): SideExercise {
  const tl = workTL(0.45);
  const bench = inclineBench({ x: 278, angle: 45, top: 104, facing: 1 });
  const rails = smithRails({ view: 'side', x: 186 });
  const fixedProps = (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => ({ back: [...bench.draw(pal), ...(spec.smith ? rails.draw(pal) : [])] });
  return {
    id: spec.id, name: spec.name, tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: spec.smith ? ['smith', 'bench'] : [spec.load, 'bench'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'traps', scale: 0.4 }, { m: 'triceps', side: 'both', scale: 0.3 }],
    props: fixedProps, propsBox: spec.smith ? [Math.min(bench.box[0], rails.box[0]), Math.max(bench.box[1], rails.box[1])] : bench.box, poster: 0.31,
    dynamic: spec.load === 'barbell'
      ? [barbell<Joints>({ view: 'side', plate: 'medium', at: (J) => ({ p: [J.S[0], J.S[1] - 133] }) })]
      : [dumbbell('n', 'profile'), dumbbell('f', 'profile')],
    pose(t) { return inclineBase(7 * tl.at(t).p); },
  };
}

/** An incline press starts at shoulder level and ends with the dumbbells or bar above the upper chest. */
export function inclinePress(spec: { id: string; name: string; en: string; sources: string[]; load: InclineLoad }): SideExercise {
  const tl = workTL(0.35);
  const bench = inclineBench({ x: 278, angle: 45, top: 104, facing: 1 });
  return {
    id: spec.id, name: spec.name, tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: [spec.load, 'bench'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.6 }, { m: 'pecs', scale: 0.3 }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box, poster: 0.31,
    dynamic: spec.load === 'barbell'
      ? [barbell<Joints>({ view: 'side', plate: 'medium', at: (J) => ({ p: [J.S[0], J.S[1] - 130] }) })]
      : [dumbbell('n', 'profile'), dumbbell('f', 'profile')],
    pose(t) {
      const p = tl.at(t).p;
      const base = inclineBase(0);
      return {
        ...base,
        arms: {
          near: { target: (J) => add(J.S, [lerp(45, 0, p), lerp(6, -125.7, p)]), side: [-1, 0], hand: -90 },
          far: { target: (J) => add(J.Sf, [lerp(42, 0, p), lerp(5, -125.7, p)]), side: [-1, 0], hand: -90 },
        },
      };
    },
  };
}

/** A high-plank scapular push-up keeps the elbows long while the shoulders glide over fixed palms. */
export function floorPushUp(spec: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const tl = workTL(0.25);
  return {
    id: spec.id, name: spec.name, tl, mat: true,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['bodyweight', 'mat'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'pecs', scale: 0.45 }, { m: 'abs', scale: 0.3 }],
    pose(t) {
      const p = tl.at(t).p;
      return {
        ...HIGH_PLANK.body(HIGH_PLANK.top), shoulderShift: 2 + 3 * p,
        arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) },
      };
    },
  };
}

/** With straight elbows, the shoulder girdle depresses to lift a hanging body only a few centimetres. */
export function scapularPullUp(spec: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  const tl = workTL(0.45);
  // A high bar leaves room for the full 126 px arm reach, upright trunk, and straight legs.
  const barY = 22, handY = GROUND - barY;
  const bar = pullUpBar({ view: 'front', y: barY, width: 248 });
  return {
    id: spec.id, name: spec.name, view: 'front', tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['pull-up-bar'], sources: spec.sources },
    muscles: [{ m: 'traps', scale: 1 }, { m: 'lats', scale: 0.55, region: { view: 'front', part: 'lats', c: [27, 0], s: [8, 28], mirror: true } }],
    props: (pal) => ({ back: bar.draw(pal) }), propsBox: bar.box, poster: 0.31,
    pose(t) {
      const p = tl.at(t).p;
      return {
        // The torso rises while shoulder depression keeps the shoulder joints at the fixed hand distance.
        pelvis: [0, STAND_Y + 8 * p, 0], shoulders: { l: { up: -8 * p }, r: { up: -8 * p } }, legs: {
          l: { target: [17, BODY.ankleH + 8 * p, 0] }, r: { target: [-17, BODY.ankleH + 8 * p, 0] },
        },
        arms: {
          l: { target: [45, handY, 0], pole: [45, handY - BODY.fore, -8] }, r: { target: [-45, handY, 0], pole: [-45, handY - BODY.fore, -8] },
        },
      };
    },
  };
}

/** Seated beside a low pulley, the elbow stays pinned to the side as the forearm sweeps across the abdomen. */
export function seatedCableInternal(spec: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const tl = workTL(0.4);
  const bench = flatBench({ view: 'side', x: 256, top: 82, length: 155 });
  const tower = cableColumn({ x: 96, pulleyY: 298, toward: 1 });
  return {
    id: spec.id, name: spec.name, tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['cable', 'bench'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'near' }, { m: 'forearms', side: 'near', scale: 0.35 }],
    props: (pal) => ({ back: [...bench.draw(pal), ...tower.draw(pal)] }), propsBox: [tower.box[0], bench.box[1]], poster: 0.31,
    dynamic: [
      cableLine<Joints>(tower.pulley, (J) => gripAt(J, 'n'), 'Low cable'),
      cableHandle<Joints>('d', (J) => {
        const grip = gripAt(J, 'n');
        return { p: grip, a: towardCable(grip, tower.pulley) };
      }),
    ],
    pose(t) {
      const fore = lerp(180, 0, tl.at(t).p);
      return {
        hip: [248, bench.seatY - 30], spine: { lumbar: -93, thoracic: -95 }, neck: -91, head: -90,
        legs: {
          near: { target: [350, G - A], foot: 0, side: [0, -1] },
          far: { target: [344, G - A], foot: 0, side: [0, -1] },
        },
        arms: {
          near: { a1: 90, a2: fore, hand: fore },
          far: { a1: 100, a2: 85, hand: 85 },
        },
      };
    },
  };
}

/** Chest stays on a 45-degree incline while long arms sweep from vertical to a diagonal Y. */
export function inclineYRaise(spec: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const tl = workTL(0.35);
  const bench = inclineBench({ x: 302, angle: 45, top: 108, back: 176, seat: 76, facing: 1 });
  return {
    id: spec.id, name: spec.name, tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['dumbbell', 'bench'], sources: spec.sources },
    muscles: [{ m: 'upperBack', scale: 1 }, { m: 'delts', side: 'both', scale: 0.65 }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box, poster: 0.31,
    dynamic: [dumbbell('n', 'profile'), dumbbell('f', 'profile')],
    pose(t) {
      const p = tl.at(t).p;
      const target = (J: Joints, shoulder: 'near' | 'far') => add(shoulder === 'near' ? J.S : J.Sf, mul(dir(lerp(88, -135, p)), BODY.upper + BODY.fore - 3));
      return {
        hip: [282, G - 160], spine: { lumbar: -151, thoracic: -151 }, neck: -151, head: -151,
        legs: {
          near: { target: [370, G - A], foot: 0, side: [0, 1] },
          far: { target: [364, G - A], foot: 0, side: [0, 1] },
        },
        arms: {
          near: { target: (J) => target(J, 'near'), side: [-1, 0.2], hand: 90 },
          far: { target: (J) => target(J, 'far'), side: [-1, 0.2], hand: 90 },
        },
      };
    },
  };
}

/**
 * Hands on a raised step with straight elbows. The shoulder blades retract, then protract. The hands and the
 * shoulder joints stay put; only the thorax sinks and rises between them.
 */
export function inclinePushUp(spec: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const tl = workTL(0.25);
  const base = inclinePose(0);
  const front = solve(base).A(0.86);
  return {
    id: spec.id, name: spec.name, tl, mat: true,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['bodyweight', 'step'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'upperBack', scale: 0.5 }, { m: 'pecs', scale: 0.45 }, { m: 'abs', scale: 0.3 }],
    props: (pal) => ({ back: inclineStep.draw(pal) }), propsBox: [174, inclineStep.box[1]], poster: 0.31,
    pose(t) {
      // p = 0: retracted, the thorax 3 px toward the step. p = 1: protracted, the thorax 4 px away from it.
      // A negative shoulderShift moves the shoulder joint toward the front of the torso; the torso moves back by
      // the same distance, so the straight arms keep their length.
      const rise = lerp(-3, 4, tl.at(t).p);
      return { ...base, shoulderShift: -rise, hip: addScaled(base.hip, front, -rise) };
    },
  };
}
/** The Smith source specifies a standing, elbow-led vertical pull despite its incline catalogue label. */
export function smithHighPull(spec: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const tl = workTL(0.35);
  const rails = smithRails({ view: 'side', x: 280 });
  return {
    id: spec.id, name: spec.name, tl,
    meta: { en: spec.en, family: 'rotator-cuff', equipment: ['smith', 'barbell'], sources: spec.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'traps', scale: 0.6 }, { m: 'upperBack', scale: 0.35 }],
    props: (pal) => ({ back: rails.draw(pal) }), propsBox: rails.box, poster: 0.31,
    dynamic: [barbell<Joints>({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose(t) {
      const p = tl.at(t).p;
      // The Smith rail is just in front of the torso: from upper thighs to upper chest.
      const handY = lerp(G - 192, G - 262, p);
      return {
        hip: [250, G - A - BODY.thigh - BODY.shin], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
        legs: standLegs(250, 0),
        arms: {
          near: { target: [280, handY], side: [-1, 0], hand: 90 },
          far: { target: [277, handY], side: [-1, 0], hand: 90 },
        },
      };
    },
  };
}
