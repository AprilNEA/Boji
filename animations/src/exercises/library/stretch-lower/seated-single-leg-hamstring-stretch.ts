// Start seated with one leg long and the opposite sole against its inner thigh.
// The torso hinges toward the long-leg ankle while both knees keep their stated positions.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, seatedHamstring } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'seated-single-leg-hamstring-stretch', name: '坐姿单腿腘绳肌拉伸',
  meta: libraryMeta('Seated Single-Leg Hamstring Stretch', ['bodyweight'], ['fe:Seated_Floor_Hamstring_Stretch']),
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'calves', side: 'near', scale: 0.3 }], pose: seatedHamstring,
}) satisfies SideExercise;
