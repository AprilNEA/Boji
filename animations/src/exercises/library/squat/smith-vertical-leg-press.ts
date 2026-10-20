// Sit with the back against the Smith-machine backrest and both feet shoulder-width on the footplate.
// Press the plate away with both legs while the back stays supported, then bend the knees slowly to the seated start.
import type { SideExercise } from '@/exercise.ts';
import { seatedLegPress } from './_squat-3.ts';

export default seatedLegPress({
  id: 'smith-vertical-leg-press', name: '史密斯坐姿腿举', en: 'Smith Vertical Leg Press',
  sources: ['hz:0760'], delta: -8, smith: true,
}) satisfies SideExercise;
