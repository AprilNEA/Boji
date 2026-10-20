// Start standing behind a preacher pad with both upper arms supported along its slope.
// Curl both dumbbells to shoulder height, then lower while the upper arms and feet stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { preacherDumbbell } from './_biceps-curl-5.ts';

export default preacherDumbbell({
  id: 'dumbbell-standing-zottman-preacher-curl', name: '站姿佐特曼牧师凳弯举', en: 'Dumbbell Standing Zottman Preacher Curl',
  equipment: ['dumbbell', 'bench'], sources: ['hz:2293'],
}, { profile: true, standing: true }) satisfies SideExercise;
