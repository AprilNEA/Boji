// Lie on one side with stacked legs and the supporting forearm directly under the shoulder.
// Lift the hips into one straight line from head through heels and hold the position.
// The forearm and feet stay planted while the trunk remains neutral.
import type { FrontExercise } from '@/exercise.ts';
import { sidePlank } from './_core-lateral.ts';

const exercise = sidePlank({
  id: 'bodyweight-forearm-side-plank', name: '自重前臂侧平板支撑', en: 'Bodyweight Forearm Side Plank',
  sources: ['hz:0705', 'hz:3544', 'fe:Side_Bridge'],
});
export default exercise satisfies FrontExercise;
