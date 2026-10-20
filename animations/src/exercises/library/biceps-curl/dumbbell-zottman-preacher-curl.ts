// Start seated with both upper arms on a preacher pad and the palms down at the top.
// Lower under control, rotate at the bottom, and curl upward while the upper arms stay supported.
import type { SideExercise } from '@/exercise.ts';
import { preacherDumbbell } from './_biceps-curl-5.ts';

export default preacherDumbbell({
  id: 'dumbbell-zottman-preacher-curl', name: '哑铃佐特曼牧师凳弯举', en: 'Dumbbell Zottman Preacher Curl',
  equipment: ['dumbbell', 'bench'], sources: ['fe:Zottman_Preacher_Curl'],
}, { profile: true }) satisfies SideExercise;
