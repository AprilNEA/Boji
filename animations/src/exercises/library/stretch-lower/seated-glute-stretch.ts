// Start seated with one ankle crossing the opposite thigh in a clear figure-four position.
// The raised knee opens outward while the opposite foot and pelvis stay on the mat.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, seatedGlute } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'seated-glute-stretch', name: '坐姿臀肌拉伸',
  meta: libraryMeta('Seated Glute Stretch', ['bodyweight'], ['hz:1424']),
  muscles: [{ m: 'glutes', side: 'far' }, { m: 'hamstrings', side: 'far', scale: 0.35 }],
  pose: seatedGlute,
}) satisfies SideExercise;
