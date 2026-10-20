// Start seated with the legs together and long on the mat.
// The torso folds toward the thighs as both arms wrap beneath the thighs to hug them.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, seatedWideFold } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'seated-leg-hug-forward-fold-stretch', name: '坐姿抱腿前屈拉伸',
  meta: libraryMeta('Seated Leg-Hug Forward Fold Stretch', ['bodyweight'], ['fe:Upper_Back-Leg_Grab']),
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'lowerBack', scale: 0.4 }, { m: 'upperBack', scale: 0.3 }], pose: seatedWideFold,
}) satisfies SideExercise;
