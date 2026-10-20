// Sit onto the roller, cross the arms, then raise the hips before leaning back.
// Shift pressure beside one side of the lumbar muscles and roll a short distance.
// The roller stays off the spine while the feet remain planted.
import type { SideExercise } from '@/exercise.ts';
import { lowerBackRoll } from './_foam-roll.ts';

export default lowerBackRoll({
  id: 'foam-roller-lower-back-release', name: '泡沫轴下背部放松', en: 'Foam Roller Lower Back Release', sources: ['fe:Lower_Back-SMR'],
}) satisfies SideExercise;
