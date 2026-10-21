// Kneel and sit back toward the heels, holding each heel with the hands.
// Push the hips up and forward over the knees, lift the chest and drop the head back into the back arch.
import type { SideExercise } from '@/exercise.ts';
import { camelPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'camel-pose', name: '骆驼式', tl: stretchTL, mat: true,
  meta: { en: 'Camel Pose', family: 'stretch-spine', equipment: ['bodyweight', 'mat'], sources: ['fe:Looking_At_Ceiling'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'hipFlexor', side: 'both', scale: 0.55 }, { m: 'abs', scale: 0.35 }],
  poster: 0.44,
  pose: (t) => camelPose(stretchTL.at(t).p),
} satisfies SideExercise;
