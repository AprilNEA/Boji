// Start seated with one foot planted outside the opposite straight knee.
// The torso rotates toward the raised knee while both sitting bones stay on the mat.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, seatedPiriformis } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'seated-piriformis-stretch', name: '坐姿梨状肌拉伸',
  meta: libraryMeta('Seated Piriformis Stretch', ['bodyweight'], ['hz:2567']),
  muscles: [{ m: 'glutes', side: 'far' }, { m: 'hamstrings', side: 'far', scale: 0.3 }],
  pose: seatedPiriformis,
}) satisfies SideExercise;
