// Private builders for horizontal-press-1. Presses start at lockout, then retain their bench, floor, ball, or foot contacts.
// The side view keeps the bar or handles readable. Variants change support, elbow path, grip posture, or assistance equipment.
import type { FrontExercise, Props, SideExercise } from '@/exercise.ts';
import { add, ang, bendFor, dir, ik2, lerp, mul, sub, timeline, type Vec2 } from '@/math.ts';
import { add3 } from '@/math3.ts';
import { project, type FrontJoints } from '@/front-rig.ts';
import { BODY, type Joints, type Pose } from '@/rig.ts';
import { A, G, GRIP_IN_HAND, standLegs } from '@/exercises/common.ts';
import { BALL, bandLine, barbell, cableColumn, cableHandle, cableLine, declineBench, flatBench, gripAt, inclineBench, stabilityBall, towardCable } from '@/exercises/equipment/index.ts';

type Support = 'flat' | 'incline' | 'decline' | 'floor';
export interface PressSpec {
  id: string; name: string; en: string; sources: string[]; support: Support;
  grip?: 'medium' | 'close' | 'wide' | 'reverse';
  chains?: boolean; board?: boolean; pins?: boolean; floorRack?: boolean; reverseBand?: boolean; power?: boolean; combo?: boolean; guillotine?: boolean;
}

// Begin at the source-defined lockout. The eccentric remains 1.6 times the concentric.
const REP = timeline([
  { d: 1.6, from: 1, to: 0, e: [0.9, 0.4] }, { d: 0.35, from: 0, to: 0, e: [0.4, 0.5] },
  { d: 1.0, from: 0, to: 1, e: [0.5, 1] }, { d: 0.45, from: 1, to: 1, e: [1, 0.9] },
]);
const COMBO = timeline([
  { d: 0.8, from: 0, to: 1, e: [0.35, 0.85] }, { d: 0.3, from: 1, to: 1, e: [0.85, 0.8] },
  { d: 0.7, from: 1, to: 0, e: [0.8, 0.9] }, { d: 0.3, from: 0, to: 0, e: [0.9, 0.85] },
  { d: 0.8, from: 0, to: 1, e: [0.85, 1] }, { d: 0.3, from: 1, to: 1, e: [1, 0.8] },
  { d: 0.8, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.5, from: 0, to: 0, e: [0.35, 0.3] },
]);
const FLAT = flatBench({ view: 'side', x: 230 });
const INCLINE = inclineBench({ x: 240, angle: 45 });
const DECLINE = declineBench({ x: 85, angle: 20, low: 72, length: 215 });

function basePose(support: Support, power = false): Omit<Pose, 'arms'> {
  if (support === 'flat') return {
    hip: [238, FLAT.seatY - 18], spine: { lumbar: power ? 176 : 180, thoracic: power ? 178 : 180 }, neck: 180, head: 180,
    farHip: 0, farShoulder: 0,
    legs: power
      ? { near: { target: [296, G - A], foot: 0, side: [0, -1] }, far: { target: [290, G - A], foot: 0, side: [0, -1] } }
      : { near: { target: [348, G - A], foot: 0, side: [0, -1] }, far: { target: [342, G - A], foot: 0, side: [0, -1] } },
  };
  if (support === 'incline') return {
    hip: [238, INCLINE.seatY - 18], spine: { lumbar: -135, thoracic: -135 }, neck: -135, head: -135,
    farHip: 0, farShoulder: 0,
    legs: { near: { target: [348, G - A], foot: 0, side: [0, -1] }, far: { target: [342, G - A], foot: 0, side: [0, -1] } },
  };
  if (support === 'decline') return {
    hip: [206, 326], spine: { lumbar: 160, thoracic: 160 }, neck: 160, head: 160,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { target: [DECLINE.roller[0], DECLINE.roller[1] + 5], foot: -25, side: [0, 1] },
      far: { target: [DECLINE.roller[0] - 4, DECLINE.roller[1] + 4], foot: -25, side: [0, 1] },
    },
  };
  return {
    hip: [242, G - 30], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180, farHip: 0, farShoulder: 0,
    legs: { near: { target: [336, G - A], foot: 0, side: [0, -1] }, far: { target: [330, G - A], foot: 0, side: [0, -1] } },
  };
}

function supportProps(s: Support, extra: PressSpec): (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => Props {
  return (pal) => {
    const back = s === 'flat' ? FLAT.draw(pal) : s === 'incline' ? INCLINE.draw(pal) : s === 'decline' ? DECLINE.draw(pal) : [];
    if (extra.pins) back.push(
      { kind: 'box', nm: 'rack-upright', color: pal.metalDark, c: [86, 260], s: [12, 364], r: 3 },
      { kind: 'box', nm: 'safety-pin', color: pal.metal, c: [145, 267], s: [120, 8], r: 3 },
    );
    if (extra.floorRack) back.push(
      { kind: 'box', nm: 'floor-rack-upright', color: pal.metalDark, c: [86, 278], s: [12, 340], r: 3 },
      { kind: 'box', nm: 'floor-rack-j-hook', color: pal.metal, c: [118, 214], s: [66, 8], r: 3 },
    );
    if (extra.reverseBand) back.push(
      { kind: 'box', nm: 'rack-left', color: pal.metalDark, c: [86, 230], s: [12, 430], r: 3 },
      { kind: 'box', nm: 'rack-top', color: pal.metalDark, c: [210, 32], s: [260, 12], r: 4 },
      { kind: 'box', nm: 'rack-right', color: pal.metalDark, c: [334, 230], s: [12, 430], r: 3 },
    );
    const front: Props['front'] = extra.board ? [{ kind: 'box', nm: 'chest-board', color: pal.propLight, c: [167, 295], s: [64, 17], r: 2 }] : undefined;
    return { back, front };
  };
}

function gripPoint(J: Joints, p: number, spec: PressSpec): Vec2 {
  const S = J.S;
  const lowX = spec.guillotine ? 8 : spec.combo ? 36 : 42;
  // A reverse grip places the wrist above the bar. Offset the bar path so both grips use the same elbow range.
  const reverse = spec.grip === 'reverse';
  const low = add(S, [lowX, spec.guillotine ? -87 : reverse ? -57 : -75]);
  const top = add(S, [spec.guillotine ? 8 : 42, spec.guillotine ? -135 : reverse ? -110 : -128]);
  const grip = [lerp(low[0], top[0], p), lerp(low[1], top[1], p)] as Vec2;
  return add(grip, [0, reverse ? -GRIP_IN_HAND : GRIP_IN_HAND]);
}

function comboGrip(J: Joints, t: number): Vec2 {
  const S = J.S;
  const wristForGrip = (g: Vec2) => add(g, [0, GRIP_IN_HAND]);
  const top = add(S, [42, -128]), bottom = add(S, [36, -75]);
  const topWrist = wristForGrip(top);
  // Keep the upper arms still during the skull-crusher portion; only the forearms rotate toward the forehead.
  const elbow = ik2(S, topWrist, BODY.upper, BODY.fore, bendFor(S, topWrist, [0, 1]), 'combo-arm').J;
  const skullAim = wristForGrip(add(S, [-22, -96]));
  const skullAngle = ang(sub(skullAim, elbow));
  const x = ((t % 1) + 1) % 1;
  if (x < 0.22) return wristForGrip([lerp(top[0], bottom[0], x / 0.22), lerp(top[1], bottom[1], x / 0.22)]);
  if (x < 0.38) return wristForGrip([lerp(bottom[0], top[0], (x - 0.22) / 0.16), lerp(bottom[1], top[1], (x - 0.22) / 0.16)]);
  if (x < 0.60) {
    const a = lerp(ang(sub(topWrist, elbow)), skullAngle, (x - 0.38) / 0.22);
    return add(elbow, mul(dir(a), BODY.fore));
  }
  if (x < 0.78) {
    const a = lerp(skullAngle, ang(sub(topWrist, elbow)), (x - 0.60) / 0.18);
    return add(elbow, mul(dir(a), BODY.fore));
  }
  return topWrist;
}

export function barbellPress(spec: PressSpec): SideExercise {
  const tl = spec.combo ? COMBO : REP;
  const tags = (spec.support === 'floor' ? ['barbell'] : ['barbell', 'bench']) as ('barbell' | 'bench' | 'band')[];
  if (spec.reverseBand) tags.push('band');
  const box = spec.support === 'flat' ? FLAT.box : spec.support === 'incline' ? INCLINE.box : spec.support === 'decline' ? DECLINE.box : [92, 382] as [number, number];
  return {
    id: spec.id, name: spec.name, tl, mat: spec.support === 'floor',
    meta: { en: spec.en, family: 'horizontal-press', equipment: tags, sources: spec.sources },
    muscles: [
      { m: spec.grip === 'close' || spec.grip === 'reverse' ? 'triceps' : 'pecs', side: 'both' },
      { m: spec.grip === 'close' || spec.grip === 'reverse' ? 'pecs' : 'triceps', side: 'both', scale: 0.55 },
      { m: 'delts', side: 'both', scale: 0.35 },
    ],
    props: supportProps(spec.support, spec), propsBox: box,
    dynamic: [
      barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) }),
      ...(spec.chains ? [{ nm: 'hanging-chain', kind: 'curve' as const, z: 'back' as const, width: 5, color: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => pal.metalDark, at: (J: Joints, t: number) => {
        const g = gripAt(J, 'n');
        // As the bar rises, more chain clears the floor; at the bottom the final links remain on it.
        const tailY = lerp(G - 7, G - 70, tl.at(t).p);
        return [[g[0] - 22, g[1]], [g[0] - 30, g[1] + 32], [g[0] - 25, tailY - 20], [g[0] - 14, tailY - 5], [g[0] - 5, tailY]] as Vec2[];
      } }] : []),
      ...(spec.reverseBand ? [
        bandLine<Joints>((J) => [[116, 40], gripAt(J, 'n')], 'underNearArm', 'reverse-band-near'),
        bandLine<Joints>((J) => [[306, 40], add(gripAt(J, 'n'), [-5, 0])], 'underNearArm', 'reverse-band-far'),
      ] : []),
    ],
    poster: 0,
    pose(t) {
      const p = tl.at(t).p;
      return {
        ...basePose(spec.support, spec.power),
        arms: {
          near: { target: (J) => spec.combo ? comboGrip(J, t) : gripPoint(J, p, spec), side: spec.grip === 'wide' || spec.guillotine ? [0, -1] : [0, 1], hand: spec.grip === 'reverse' ? 90 : -90 },
          far: { target: (J) => {
            const w = spec.combo ? comboGrip(J, t) : gripPoint(J, p, spec);
            return add(w, sub(J.Sf, J.S));
          }, side: spec.grip === 'wide' || spec.guillotine ? [0, -1] : [0, 1], hand: spec.grip === 'reverse' ? 90 : -90 },
        },
      };
    },
  };
}
export interface BandBenchSpec { id: string; name: string; en: string; sources: string[]; seated?: boolean; }
export function bandBenchPress(spec: BandBenchSpec): SideExercise {
  const chair: Props['back'] = spec.seated ? [
    { kind: 'box', nm: 'chair-seat', color: '#777777', c: [230, G - 74], s: [110, 16], r: 7 },
    { kind: 'box', nm: 'chair-back', color: '#777777', c: [177, G - 155], s: [16, 152], r: 7 },
    { kind: 'box', nm: 'chair-leg', color: '#555555', c: [250, G - 38], s: [10, 64], r: 3 },
  ] : [];
  return {
    id: spec.id, name: spec.name, tl: REP,
    meta: { en: spec.en, family: 'horizontal-press', equipment: spec.seated ? ['band', 'chair'] : ['band', 'bench'], sources: spec.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: spec.seated ? chair : FLAT.draw(pal) }), propsBox: spec.seated ? [150, 360] : FLAT.box,
    dynamic: [
      bandLine<Joints>((J) => [spec.seated ? [157, G - 164] : [FLAT.box[0] + 14, FLAT.seatY + 20], gripAt(J, 'n')], 'underNearArm', 'band-near'),
      bandLine<Joints>((J) => [spec.seated ? [157, G - 150] : [FLAT.box[0] + 20, FLAT.seatY + 31], gripAt(J, 'f')], 'underNearArm', 'band-far'),
    ], poster: 0,
    pose(t) {
      const p = REP.at(t).p;
      const base: Omit<Pose, 'arms'> = spec.seated
        ? { hip: [225, G - 104], spine: { lumbar: -90, thoracic: -92 }, neck: -90, head: -90, legs: { near: { target: [324, G - A], foot: 0, side: [0, -1] }, far: { target: [318, G - A], foot: 0, side: [0, -1] } } }
        : basePose('flat');
      return {
        ...base,
        arms: {
          near: spec.seated
            ? { target: (J) => add(J.S, [lerp(84, 126, p), lerp(12, 0, p)]), side: [0, 1], hand: 0 }
            : { target: (J) => add(J.S, [42, lerp(-75, -119, p)]), side: [0, 1], hand: -90 },
          far: spec.seated
            ? { target: (J) => add(J.Sf, [lerp(84, 126, p), lerp(12, 0, p)]), side: [0, 1], hand: 0 }
            : { target: (J) => add(J.Sf, [42, lerp(-75, -119, p)]), side: [0, 1], hand: -90 },
        },
      };
    },
  };
}

export function standingCablePress(id: string, name: string, en: string, sources: string[]): SideExercise {
  const tower = cableColumn({ x: 88, pulleyY: 267, toward: 1 });
  return {
    id, name, tl: REP,
    meta: { en, family: 'horizontal-press', equipment: ['cable'], sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.35 }, { m: 'abs', scale: 0.3 }],
    props: (pal) => ({ back: tower.draw(pal) }), propsBox: [tower.box[0], 382], poster: 0,
    dynamic: [
      cableLine(tower.pulley, (J) => gripAt(J, 'n'), 'cable-near'),
      cableLine(add(tower.pulley, [0, 13]), (J) => gripAt(J, 'f'), 'cable-far'),
      cableHandle('d', (J) => { const g = gripAt(J, 'n'); return { p: g, a: towardCable(g, tower.pulley) }; }),
    ],
    pose(t) {
      const p = REP.at(t).p;
      return {
        hip: [274, G - A - 181], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, legs: standLegs(274),
        arms: {
          near: { target: (J) => add(J.S, [lerp(84, 126, p), lerp(12, 0, p)]), side: [0, 1], hand: 0 },
          far: { target: (J) => add(J.Sf, [lerp(84, 126, p), lerp(12, 0, p)]), side: [0, 1], hand: 0 },
        },
      };
    },
  };
}

export function ballCablePress(id: string, name: string, en: string, sources: string[]): SideExercise {
  const tower = cableColumn({ x: 79, pulleyY: 258, toward: 1 });
  return {
    id, name, tl: REP,
    meta: { en, family: 'horizontal-press', equipment: ['cable', 'stability-ball'], sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.35 }, { m: 'abs', scale: 0.4 }],
    props: (pal) => ({ back: tower.draw(pal) }), propsBox: [tower.box[0], 386], poster: 0,
    dynamic: [
      stabilityBall<Joints>(() => ({ p: [228, G - BALL.r] }), 'back'),
      cableLine(tower.pulley, (J) => gripAt(J, 'n'), 'cable-near'),
      cableLine(add(tower.pulley, [0, 14]), (J) => gripAt(J, 'f'), 'cable-far'),
      cableHandle('d', (J) => { const g = gripAt(J, 'n'); return { p: g, a: towardCable(g, tower.pulley) }; }),
    ],
    pose(t) {
      const p = REP.at(t).p;
      return {
        hip: [228, G - BALL.d + 8], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
        legs: { near: { target: [322, G - A], foot: 0, side: [0, -1] }, far: { target: [316, G - A], foot: 0, side: [0, -1] } },
        arms: {
          near: { target: (J) => add(J.S, [lerp(84, 126, p), lerp(12, 0, p)]), side: [0, 1], hand: 0 },
          far: { target: (J) => add(J.Sf, [lerp(84, 126, p), lerp(12, 0, p)]), side: [0, 1], hand: 0 },
        },
      };
    },
  };
}

export function standingBandRotation(id: string, name: string, en: string, sources: string[]): FrontExercise {
  // Screen coordinates for a chest-height anchor at the figure's right side.
  const anchor: Vec2 = [-160, G - 224];
  return {
    id, name, view: 'front', tl: REP,
    meta: { en, family: 'horizontal-press', equipment: ['band'], sources },
    muscles: [
      { m: 'pecs' }, { m: 'delts', side: 'r', scale: 0.5 },
      { m: 'triceps', side: 'r', scale: 0.55, region: { view: 'front', part: 'upper', c: [0, 34], s: [12, 29] } },
      { m: 'obliques', scale: 0.45 },
    ],
    props: (pal) => ({ back: [{ kind: 'box', nm: 'band-anchor', color: pal.metalDark, c: anchor, s: [16, 46], r: 4 }] }), propsBox: [-176, 88], poster: 0,
    dynamic: [bandLine<FrontJoints>((J) => [anchor, project(J.tip_r)], 'underNearArm', 'rotating-band')],
    pose(t) {
      const p = REP.at(t).p;
      return {
        // The right shoulder begins across the body and rotates away from the anchor as it presses.
        pelvis: [0, BODY.ankleH + 178, 0], hips: { yaw: -lerp(6, 22, p) }, spine: { yaw: -lerp(8, 30, p) }, head: { yaw: -lerp(3, 9, p) },
        legs: {
          l: { target: [21, BODY.ankleH, 5] },
          r: { target: [-25, BODY.ankleH, 0] },
        },
        arms: {
          // Screen-left arm is the working arm because the anchor is on that side.
          r: { target: (J) => add3(J.shoulder_r, [lerp(-24, -10, p), lerp(8, 2, p), lerp(83, 125, p)]), pole: [-1, 0, 1] },
          l: { target: (J) => add3(J.shoulder_l, [12, -20, 50]), pole: [1, 0, 1] },
        },
      };
    },
  };
}
