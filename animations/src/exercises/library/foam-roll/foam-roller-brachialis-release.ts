// Lie on one side with the outer upper arm resting on the roller.
// Lift the hips, share support between the feet and the arm, and relax the biceps.
// Roll a short distance along the outer upper-arm muscle before changing sides.
import type { SideExercise } from '@/exercise.ts';
import { brachialisRoll } from './_foam-roll.ts';

export default brachialisRoll({
  id: 'foam-roller-brachialis-release', name: '泡沫轴肱肌放松', en: 'Foam Roller Brachialis Release', sources: ['fe:Brachialis-SMR'],
}) satisfies SideExercise;
