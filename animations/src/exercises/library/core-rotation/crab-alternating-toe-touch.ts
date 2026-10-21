// Begin in a raised crab support, with bent knees, planted feet, and palms behind the hips.
// Lift one nearly straight leg toward the chest while the opposite hand reaches toward its toes.
// The bracing palm and the other foot stay fixed; return, then repeat on the other side.
import type { SideExercise } from '@/exercise.ts';
import { ang, len, lerp, lerpV, polar, sub, type Vec2 } from '@/math/vec2.ts';
import type { Joints } from '@/rig/side.ts';
import { FLOOR } from '@/exercises/common.ts';
import { alternatingTL, alternate } from './_core-rotation-1.ts';

// The diagonal trunk keeps the chest and head up while the palms remain within a straight-arm reach.
const HIP: [number, number] = [255, FLOOR - 66];
const HAND: [number, number] = [110, FLOOR - 7];
const FOOT: [number, number] = [365, FLOOR - 13];
// Keep the elevated shoe clear of the floor as the knee opens toward a straight leg.
const RAISED_FOOT: [number, number] = [280, FLOOR - 245];
const REACH: [number, number] = [258, FLOOR - 196];
/**
 * The reaching hand travels on an arc around its shoulder, the short way: down past the hips and up toward
 * the toes. A straight line from the floor behind to the toes passes next to the shoulder, which makes the
 * IK fold the arm and swing the elbow over the head.
 */
const reachAt = (p: number, shoulder: (J: Joints) => Vec2) => (J: Joints): Vec2 => {
  const S = shoulder(J), from = sub(HAND, S), to = sub(REACH, S);
  const a0 = ang(from);
  let a1 = ang(to);
  if (a1 - a0 > 180) a1 -= 360;
  if (a1 - a0 < -180) a1 += 360;
  return polar(S, lerp(a0, a1, p), lerp(len(from), len(to), p));
};
export default {
  id: 'crab-alternating-toe-touch', name: '蟹式交替触脚', tl: alternatingTL, mat: true, poster: 0.14,
  meta: { en: 'Crab Alternating Toe Touch', family: 'core-rotation', equipment: ['bodyweight'], sources: ['hz:1468'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.7 }, { m: 'hipFlexor', side: 'both', scale: 0.5 }, { m: 'delts', side: 'both', scale: 0.35 }],
  pose(t) {
    const { p, near } = alternate(t);
    const support = { target: HAND, side: [-1, 0] as [number, number], hand: 0 };
    const reach = { target: reachAt(p, near ? (J) => J.Sf : (J) => J.S), side: [-1, 0] as [number, number], hand: -45 };
    const planted = { target: FOOT, foot: 0, side: [0, -1] as [number, number] };
    const lifted = { target: lerpV(FOOT, RAISED_FOOT, p), foot: -70, side: [0, -1] as [number, number] };
    return {
      hip: HIP, spine: { lumbar: 210, thoracic: 210 }, neck: 210, head: 210,
      legs: near ? { near: lifted, far: planted } : { near: planted, far: lifted },
      arms: near ? { near: support, far: reach } : { near: reach, far: support },
    };
  },
} satisfies SideExercise;
