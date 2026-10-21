// Shared side-view horizontal-press builder for the horizontal-press-2 work list.
// The support, grip, active arm count, cable path and bench angle are explicit so that each exported exercise remains a distinct movement.
import type { LibraryMeta, Props, SideExercise } from '@/exercise.ts';
import { add, ang, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import type { Joints, LimbSpec, Pose } from '@/rig/side.ts';
import { A, ARM_STRAIGHT, G } from '@/exercises/common.ts';
import {
  BALL, cableColumn, cableHandle, cableLine, declineBench, dumbbell, flatBench,
  gripAt, handleEnd, inclineBench, stabilityBall, towardCable, workTL,
} from '@/exercises/equipment/index.ts';

type Support = 'flat' | 'incline' | 'decline' | 'ball' | 'ball-seat' | 'incline-ball' | 'floor' | 'seat' | 'standing';
type Grip = 'end' | 'profile' | 'reverse';
type CableHeight = 'low' | 'mid' | 'high';

export interface PressSpec {
  id: string;
  name: string;
  en: string;
  sources: string[];
  support: Support;
  implement: 'dumbbell' | 'cable';
  single?: boolean;
  alternating?: boolean;
  grip?: Grip;
  cableHeight?: CableHeight;
  tricepsPrimary?: boolean;
  tucked?: boolean;
}

const tl = workTL(0.35);
const flat = flatBench({ view: 'side', x: 210 });
const incline = inclineBench({ x: 240, angle: 45 });
const decline = declineBench({ x: 85, angle: 20, low: 72, length: 215 });

/** All lying bases use the same scale and fixed foot or ankle contact as the guide's chest-fly references. */
function basePose(support: Support): Omit<Pose, 'arms'> {
  if (support === 'flat') return {
    hip: [238, flat.seatY - 18], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { target: [348, G - A], foot: 0, side: [0, -1] },
      far: { target: [342, G - A], foot: 0, side: [0, -1] },
    },
  };
  if (support === 'incline') return {
    hip: [238, incline.seatY - 18], spine: { lumbar: -135, thoracic: -135 }, neck: -135, head: -135,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { target: [348, G - A], foot: 0, side: [0, -1] },
      far: { target: [342, G - A], foot: 0, side: [0, -1] },
    },
  };
  if (support === 'decline') return {
    hip: [206, 326], spine: { lumbar: 160, thoracic: 160 }, neck: 160, head: 160,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { target: [decline.roller[0], decline.roller[1] + 5], foot: -25, side: [0, 1] },
      far: { target: [decline.roller[0] - 4, decline.roller[1] + 4], foot: -25, side: [0, 1] },
    },
  };
  if (support === 'ball') return {
    // The upper back sits on the ball crown and the hips stay high, as in a supported bridge.
    hip: [246, G - BALL.r - 67], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { target: [350, G - A], foot: 0, side: [0, -1] },
      far: { target: [342, G - A], foot: 0, side: [0, -1] },
    },
  };
  if (support === 'ball-seat') return {
    // The pelvis rests on the ball crown. Both feet stay flat while the torso remains upright.
    hip: [245, G - BALL.r + 6], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: {
      near: { target: [315, G - A], foot: 0, side: [0, -1] },
      far: { target: [309, G - A], foot: 0, side: [0, -1] },
    },
  };
  if (support === 'incline-ball') return {
    // The ball is under the hips while the upper back follows the 45-degree pad.
    hip: [240, 324], spine: { lumbar: -135, thoracic: -135 }, neck: -135, head: -135,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { target: [348, G - A], foot: 0, side: [0, -1] },
      far: { target: [342, G - A], foot: 0, side: [0, -1] },
    },
  };
  if (support === 'floor') return {
    hip: [238, G - 24], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { target: [340, G - A], foot: 0, side: [0, -1] },
      far: { target: [334, G - A], foot: 0, side: [0, -1] },
    },
  };
  if (support === 'seat') return {
    hip: [226, G - 104], spine: { lumbar: -97, thoracic: -100 }, neck: -94, head: -92,
    legs: {
      near: { target: [326, G - A], foot: 0, side: [0, -1] },
      far: { target: [320, G - A], foot: 0, side: [0, -1] },
    },
  };
  // The staggered stance remains fully planted while the torso stays quiet.
  return {
    hip: [250, 258], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: {
      near: { target: [280, G - A], foot: 0, side: [1, 0] },
      far: { target: [235, G - A], foot: 0, side: [1, 0] },
    },
  };
}

function seatProps(pal: Parameters<NonNullable<SideExercise['props']>>[0]): Props {
  return {
    back: [
      { kind: 'box', nm: 'seat-foot', color: pal.metalDark, c: [229, G - 4], s: [150, 8], r: 3 },
      { kind: 'box', nm: 'seat-post', color: pal.metalDark, c: [232, 402], s: [12, 86], r: 3 },
      { kind: 'box', nm: 'seat', color: pal.pad, c: [236, G - 82], s: [88, 18], r: 8 },
      { kind: 'box', nm: 'back-post', color: pal.metalDark, c: [187, 344], s: [12, 200], r: 3 },
      { kind: 'box', nm: 'backrest', color: pal.pad, c: [196, 287], s: [18, 150], r: 8 },
    ],
  };
}

function supportProps(support: Support, pal: Parameters<NonNullable<SideExercise['props']>>[0]): Props {
  if (support === 'flat') return { back: flat.draw(pal) };
  if (support === 'incline' || support === 'incline-ball') return { back: incline.draw(pal) };
  if (support === 'decline') return { back: decline.draw(pal) };
  if (support === 'seat') return seatProps(pal);
  return { back: [] };
}

function supportBox(support: Support): [number, number] {
  if (support === 'flat') return flat.box;
  if (support === 'incline') return incline.box;
  if (support === 'decline') return decline.box;
  if (support === 'incline-ball') return [Math.min(incline.box[0], 180), 380];
  if (support === 'ball') return [55, 390];
  if (support === 'ball-seat') return [150, 365];
  if (support === 'seat') return [145, 365];
  if (support === 'floor') return [105, 390];
  return [54, 330];
}

/** Approximate pulley positions that remain behind the shoulder line and make each cable direction readable. */
function pulleyFor(support: Support, height: CableHeight): Vec2 {
  const base: Record<Support, Vec2> = {
    flat: [82, 308], incline: [86, 244], decline: [55, 350], ball: [100, 292],
    'ball-seat': [88, 216], 'incline-ball': [110, 240], floor: [82, 308], seat: [84, 244], standing: [92, 162],
  };
  const p = base[support];
  if (height === 'low') return [p[0], p[1] + 72];
  if (height === 'high') return [p[0], p[1] - 72];
  return p;
}

/** The floor bottom places the upper arm on the mat; a tucked press keeps the elbow closer to the torso. */
function pressArm(p: number, far = false, support?: Support, tucked = false, reverse = false): LimbSpec {
  return {
    target: (J: Joints) => {
      const shoulder = far ? J.Sf : J.S;
      const normal = J.A(0.86);
      const tangent = J.T(0.86);
      const top = mul(normal, ARM_STRAIGHT - 0.1);
      if (support === 'floor') {
        // At the bottom, the elbow is on the floor and the forearm is vertical.
        const bottom = add(mul(normal, 40), mul(tangent, -65));
        return add(shoulder, add(mul(bottom, 1 - p), mul(top, p)));
      }
      if (tucked) {
        // The hand remains over the lower chest while the elbow stays near the ribs.
        const bottom = add(mul(normal, 85), mul(tangent, -25));
        return add(shoulder, add(mul(bottom, 1 - p), mul(top, p)));
      }
      return add(shoulder, mul(normal, lerp(89, ARM_STRAIGHT - 0.1, p)));
    },
    side: [1, 0],
    hand: (J: Joints) => ang(J.A(0.86)) + (reverse ? 180 : 0),
  };
}

/** The non-working arm rests across the torso, so it stays clear of the bench and does not imply a second loaded arm. */
function restArm(J: Joints): Vec2 {
  return add(J.B(0.45), mul(J.A(0.45), 14));
}

function exerciseEquipment(spec: PressSpec): LibraryMeta['equipment'] {
  const equipment: LibraryMeta['equipment'] = [spec.implement];
  if (spec.support === 'flat' || spec.support === 'incline' || spec.support === 'decline' || spec.support === 'seat' || spec.support === 'incline-ball') equipment.push('bench');
  if (spec.support === 'ball' || spec.support === 'ball-seat' || spec.support === 'incline-ball') equipment.push('stability-ball');
  return equipment;
}

/** Build one press with fixed support points and a wrist path measured from the shoulder normal. */
export function horizontalPress(spec: PressSpec): SideExercise {
  const isCable = spec.implement === 'cable';
  const pulley = isCable ? pulleyFor(spec.support, spec.cableHeight ?? 'mid') : undefined;
  const station = pulley ? cableColumn({ x: pulley[0] - 17, pulleyY: pulley[1], toward: 1 }) : undefined;
  const box = supportBox(spec.support);
  const propsBox: [number, number] = station ? [Math.min(box[0], station.box[0]), Math.max(box[1], station.box[1])] : box;
  const grip = spec.grip ?? 'end';
  const muscleSide = spec.single ? 'near' as const : 'both' as const;

  return {
    id: spec.id,
    name: spec.name,
    tl,
    mat: spec.support === 'floor',
    meta: { en: spec.en, family: 'horizontal-press', equipment: exerciseEquipment(spec), sources: spec.sources },
    muscles: [
      { m: 'pecs' },
      { m: 'triceps', side: muscleSide, scale: spec.tricepsPrimary ? 1 : 0.65 },
      { m: 'delts', side: muscleSide, scale: 0.45 },
      ...(spec.support === 'ball' || spec.support === 'ball-seat' || spec.support === 'incline-ball' ? [{ m: 'abs' as const, scale: 0.3 }] : []),
    ],
    props: (pal) => {
      const support = supportProps(spec.support, pal);
      return { back: [...(support.back ?? []), ...(station?.draw(pal) ?? [])] };
    },
    propsBox,
    dynamic: [
      ...(spec.support === 'ball' ? [stabilityBall<Joints>(() => ({ p: [126, G - BALL.r] }), 'back')] : []),
      ...(spec.support === 'ball-seat' ? [stabilityBall<Joints>(() => ({ p: [235, G - BALL.r] }), 'back')] : []),
      ...(spec.support === 'incline-ball' ? [stabilityBall<Joints>(() => ({ p: [266, G - BALL.r] }), 'back')] : []),
      ...(isCable && pulley && station ? [
        cableLine<Joints>(station.pulley, (J) => {
          const g = gripAt(J, 'n');
          return handleEnd(g, towardCable(g, station.pulley));
        }, 'Near Cable'),
        cableHandle<Joints>('d', (J) => {
          const g = gripAt(J, 'n');
          return { p: g, a: towardCable(g, station.pulley) };
        }),
        ...(spec.single ? [] : [
          cableLine<Joints>(station.pulley, (J) => {
            const g = gripAt(J, 'f');
            return handleEnd(g, towardCable(g, station.pulley));
          }, 'Far Cable'),
          cableHandle<Joints>('d', (J) => {
            const g = gripAt(J, 'f');
            return { p: g, a: towardCable(g, station.pulley) };
          }, { z: 'overFarArm' }),
        ]),
      ] : spec.single
        ? [dumbbell('n', grip === 'reverse' ? 'end' : grip)]
        : [dumbbell('f', grip === 'reverse' ? 'end' : grip), dumbbell('n', grip === 'reverse' ? 'end' : grip)]),
    ],
    // The bottom position exposes the elbow angle and the support, which identifies a press more clearly than lockout.
    poster: 0,
    pose(t) {
      const p = tl.at(t).p;
      const farP = spec.alternating ? 1 - p : p;
      const base = basePose(spec.support);
      return {
        ...base,
        arms: {
          near: pressArm(p, false, spec.support, spec.tucked, grip === 'reverse'),
          far: spec.single
            ? { target: restArm, side: [0, -1], hand: 0 }
            : pressArm(farP, true, spec.support, spec.tucked, grip === 'reverse'),
        },
      };
    },
  };
}
