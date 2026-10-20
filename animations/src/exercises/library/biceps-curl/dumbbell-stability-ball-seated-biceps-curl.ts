// Seated bilateral dumbbell curl on a stability ball, side view. The back remains straight and both feet stay planted.
// Both upper arms stay still as the elbows curl from about 165° to 45°.
// The dumbbells follow both hands and return together under control.
import type { SideExercise } from '@/exercise.ts';
import { makeBallCurl } from './_biceps-curl-4.ts';

export default makeBallCurl({
  id: 'dumbbell-stability-ball-seated-biceps-curl',
  name: '健身球坐姿哑铃弯举',
  en: 'Dumbbell Stability Ball Seated Biceps Curl',
  sources: ['hz:0390'],
  bilateral: true,
}) satisfies SideExercise;
