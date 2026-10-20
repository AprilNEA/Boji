// Hold a forearm side plank with straight, stacked legs and hips lifted.
// The top arm begins down and raises the dumbbell away from the torso in a reverse fly.
// Keep the supporting elbow under the shoulder and the trunk straight.
import type { FrontExercise } from '@/exercise.ts';
import { sidePlank } from './_core-lateral.ts';

const exercise = sidePlank({
  id: 'dumbbell-side-plank-with-reverse-fly', name: '哑铃侧平板支撑反向飞鸟', en: 'Dumbbell Side Plank with Reverse Fly', dumbbell: true,
  sources: ['hz:3664'],
});
export default exercise satisfies FrontExercise;
