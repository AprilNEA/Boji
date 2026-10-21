// Begin low over the palms, then draw the knees toward the bent upper arms.
// The palms remain fixed on the mat while the feet tuck clear of the floor.
// The balance position holds a straight, level torso without letting the elbows collapse inward.
import type { SideExercise } from '@/exercise.ts';
import { workTL } from '@/exercises/equipment/index.ts';
import { lerp } from '@/math/vec2.ts';
import { smooth } from '@/math/timeline.ts';
import { frogStandPose } from './_core-stability-2.ts';

const tl = workTL(0.8);

const pose = (t: number) => {
  const p = tl.at(t).p;
  const base = frogStandPose(p);
  const tuck = smooth(p);
  const a1 = lerp(17, 29, tuck);
  // The shins fold clockwise from the thighs as the feet lift into the tuck.
  const a2 = lerp(147, 205, tuck);
  return {
    ...base,
    legs: {
      near: { a1, a2, foot: a2 },
      far: { a1, a2, foot: a2 + 2 },
    },
  };
};

export default {
  id: 'frog-stand',
  name: '蛙式支撑',
  tl,
  mat: true,
  meta: { en: 'Frog Stand', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3301'] },
  muscles: [
    { m: 'abs' }, { m: 'delts', side: 'both', scale: 0.65 },
    { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'pecs', scale: 0.35 },
  ],
  poster: 0.34,
  pose,
} satisfies SideExercise;
