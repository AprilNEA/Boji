// Run tall on the moving belt with the arms swinging opposite the legs.
// Each stride has a clear flight phase and returns to the same balanced running stance.
import type { SideExercise } from '@/exercise.ts';
import { treadmill } from './_cardio-2.ts';

export default {
  ...treadmill({ en: 'Treadmill Running', sources: ['fe:Running_Treadmill'] }, '跑步机跑步', 'run'),
  id: 'treadmill-running',
} satisfies SideExercise;
