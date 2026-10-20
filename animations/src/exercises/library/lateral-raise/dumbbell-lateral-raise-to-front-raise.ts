// Stand upright with dumbbells at the sides and both feet fixed under the hips.
// Complete a lateral raise and return, then complete a front raise and return at shoulder height.
import type { FrontExercise } from '@/exercise.ts';
import { lateralToFront } from './_lateral-raise.ts';
export default lateralToFront({ id: 'dumbbell-lateral-raise-to-front-raise', name: '哑铃侧平举转前平举', en: 'Dumbbell Lateral Raise to Front Raise', sources: ['fe:Side_Laterals_to_Front_Raise', 'hz:0335'] }) satisfies FrontExercise;
