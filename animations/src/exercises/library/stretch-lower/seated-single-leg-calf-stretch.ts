// Start seated on the mat with one knee bent for stability and the other leg straight.
// The hand reaches toward the long foot as the ankle dorsiflexes to stretch the calf.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, seatedCalf } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'seated-single-leg-calf-stretch', name: '坐姿单腿小腿拉伸',
  meta: libraryMeta('Seated Single-Leg Calf Stretch', ['bodyweight'], ['fe:Seated_Calf_Stretch']),
  muscles: [{ m: 'calves', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.4 }], pose: seatedCalf,
}) satisfies SideExercise;
