// Stand upright with both feet flat and the pelvis held neutral under the rib cage.
// Raise both straight arms overhead with the hands together, without lifting the shoulders toward the ears.
import type { SideExercise } from '@/exercise.ts';
import { standingOverheadPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'standing-overhead-stretch', name: '站姿过顶伸展', tl: stretchTL,
  meta: { en: 'Standing Overhead Stretch', family: 'stretch-spine', equipment: ['bodyweight'], sources: ['fe:Overhead_Stretch', 'fe:Upward_Stretch'] },
  muscles: [{ m: 'lats' }, { m: 'triceps', side: 'both', scale: 0.5 }, { m: 'abs', scale: 0.35 }],
  poster: 0.44, pose: (t) => standingOverheadPose(stretchTL.at(t).p),
} satisfies SideExercise;
