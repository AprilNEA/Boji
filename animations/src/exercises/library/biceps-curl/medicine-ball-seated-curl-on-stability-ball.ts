// Start seated upright on a stability ball with both feet flat and a medicine ball cradled underhand.
// Curl the medicine ball toward the shoulders, while the upper arms stay at the sides and the pelvis stays centered.
import type { SideExercise } from '@/exercise.ts';
import { ballCurl } from './_biceps-curl-5.ts';

export default ballCurl({
  id: 'medicine-ball-seated-curl-on-stability-ball', name: '健身球坐姿药球弯举', en: 'Medicine Ball Seated Curl on Stability Ball',
  equipment: ['medicine-ball', 'stability-ball'], sources: ['hz:0847'],
}, { medicine: true }) satisfies SideExercise;
