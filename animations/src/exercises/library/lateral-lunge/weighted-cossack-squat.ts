// Start in a wide stance while holding a weight plate in front of the chest.
// Sit low toward one heel with the other leg long, chest high and both feet planted.
// Return to the wide start and repeat the Cossack squat on the opposite side.
import type { FrontExercise } from '@/exercise.ts';
import { lateralLunge } from './_lateral-lunge.ts';

export default lateralLunge({
  id: 'weighted-cossack-squat',
  name: '负重哥萨克深蹲',
  en: 'Weighted Cossack Squat',
  sources: ['hz:3643'],
  load: 'plate',
  stance: 'fixed',
  alternate: true,
  depth: 'cossack',
  toeOut: 18,
}) satisfies FrontExercise;
