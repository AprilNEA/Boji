// Start seated upright on the BOSU dome with knees bent and both feet flat.
// Curl both dumbbells while the upper arms remain at the sides and the pelvis stays centered on the dome.
import type { SideExercise } from '@/exercise.ts';
import { ballCurl } from './_biceps-curl-5.ts';

export default ballCurl({
  id: 'dumbbell-v-sit-curl-on-bosu-ball', name: 'BOSU坐姿哑铃弯举', en: 'Dumbbell V-Sit Curl on BOSU Ball',
  equipment: ['dumbbell', 'bosu'], sources: ['hz:1656'],
}, { bosu: true }) satisfies SideExercise;
