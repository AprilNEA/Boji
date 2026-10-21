// Start in a crab position with hips lifted, bent knees, planted feet, and hands behind the body.
// Extend one leg forward while the opposite hand leaves the floor and reaches toward that foot.
// Replace the hand and foot with control, then repeat on the other side.
import type { SideExercise } from '@/exercise.ts';
import { lerpV } from '@/math/vec2.ts';
import { FLOOR } from '@/exercises/common.ts';
import { alternatingTL, alternate } from './_core-rotation-1.ts';

const HIP: [number, number] = [255, FLOOR - 86];
const HAND: [number, number] = [165, FLOOR - 7];
const FOOT: [number, number] = [365, FLOOR - 13];
// Keep the elevated shoe clear of the floor during the full toe-touch arc.
const RAISED_FOOT: [number, number] = [350, FLOOR - 151];
const REACH: [number, number] = [264, FLOOR - 67];
export default {
  id: 'crab-alternating-toe-touch', name: '蟹式交替触脚', tl: alternatingTL, mat: true, poster: 0.14,
  meta: { en: 'Crab Alternating Toe Touch', family: 'core-rotation', equipment: ['bodyweight'], sources: ['hz:1468'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.7 }, { m: 'hipFlexor', side: 'both', scale: 0.5 }, { m: 'delts', side: 'both', scale: 0.35 }],
  pose(t) {
    const { p, near } = alternate(t);
    const support = { target: HAND, side: [-1, 0] as [number, number], hand: 0 };
    const reach = { target: lerpV(HAND, REACH, p), side: [-1, 0] as [number, number], hand: 0 };
    const planted = { target: FOOT, foot: 0, side: [0, -1] as [number, number] };
    const lifted = { target: lerpV(FOOT, RAISED_FOOT, p), foot: -70, side: [0, -1] as [number, number] };
    return {
      hip: HIP, spine: { lumbar: 165, thoracic: 165 }, neck: 165, head: 165,
      legs: near ? { near: lifted, far: planted } : { near: planted, far: lifted },
      arms: near ? { near: support, far: reach } : { near: reach, far: support },
    };
  },
} satisfies SideExercise;
