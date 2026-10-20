// Jog tall on the moving belt with a compact natural arm swing.
// The legs alternate through a short airborne swing and a soft planted stance.
import type { SideExercise } from '@/exercise.ts';
import { treadmill } from './_cardio-2.ts';

export default {
  ...treadmill({ en: 'Treadmill Jogging', sources: ['fe:Jogging_Treadmill'] }, '跑步机慢跑', 'jog'),
  id: 'treadmill-jogging',
} satisfies SideExercise;
