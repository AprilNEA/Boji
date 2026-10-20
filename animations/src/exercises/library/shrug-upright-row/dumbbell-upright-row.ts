// Start with the dumbbells at the upper thighs and the torso tall and still.
// Raise both loads close to the body as the elbows travel outward and above the forearms.
import type { FrontExercise } from '@/exercise.ts';
import { frontUprightRow } from './_shrug-upright-row.ts';

export default frontUprightRow({
  id: 'dumbbell-upright-row', name: '哑铃直立划船', en: 'Dumbbell Upright Row',
  equipment: ['dumbbell'],
  sources: ['fe:Standing_Dumbbell_Upright_Row', 'hz:0437', 'hz:1765'], implement: 'dumbbell',
}) satisfies FrontExercise;
