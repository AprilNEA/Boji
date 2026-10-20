// Begin on the toes with the hands on a loaded bar, the arms perpendicular to the floor.
// Roll the bar toward the planted feet and lift the hips into a straight-leg pike before returning.
import type { SideExercise } from '@/exercise.ts';
import { hipForShoulder, FLOOR } from '@/exercises/common.ts';
import { barbell, gripAt, PLATE, workTL } from '@/exercises/equipment/index.ts';
import { lerp } from '@/math.ts';

const tl = workTL(0.6);
const ANKLE: [number, number] = [130, FLOOR - 41];
// The end stays far enough ahead of the toes for the legs to remain straight in the pike.
const barX = (p: number) => lerp(395, 292, p);

export default {
  id: 'barbell-straight-leg-ab-rollout',
  name: '杠铃直腿健腹滚动',
  tl,
  mat: true,
  meta: { en: 'Barbell Straight-Leg Ab Rollout', family: 'core-stability', equipment: ['barbell'], sources: ['fe:Barbell_Ab_Rollout'] },
  muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }, { m: 'delts', side: 'both', scale: 0.4 }, { m: 'lowerBack', scale: 0.3 }],
  dynamic: [barbell({ view: 'side', plate: 'small', at: (J) => ({ p: gripAt(J, 'n') }) })],
  propsBox: [ANKLE[0] - 40, 442],
  poster: 0.28,
  pose(t) {
    const p = tl.at(t).p, x = barX(p), a = lerp(-35, 35, p);
    const spine = { lumbar: a, thoracic: a };
    const S: [number, number] = [x, 300];
    return {
      hip: hipForShoulder(S, spine), spine, neck: a - 3, head: a - 1, farHip: 0, farShoulder: 0,
      legs: {
        near: { target: ANKLE, side: [0, 1], foot: 85 }, far: { target: [ANKLE[0] + 4, ANKLE[1]], side: [0, 1], foot: 85 },
      },
      arms: {
        near: { target: [x, 422], side: [-1, 0], hand: 90 }, far: { target: [x, 422], side: [-1, 0], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
