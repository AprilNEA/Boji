// Walk upright on the moving belt with natural opposite arm swing.
// One foot stays planted while the other makes a low forward swing.
import type { SideExercise } from '@/exercise.ts';
import { treadmill } from './_cardio-2.ts';

export default {
  ...treadmill({ en: 'Treadmill Walking', sources: ['fe:Walking_Treadmill'] }, '跑步机步行', 'walk'),
  id: 'treadmill-walking',
} satisfies SideExercise;
