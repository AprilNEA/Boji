// Sit with the back supported and the feet on forward pedals.
// The feet make opposite crank circles while the hands hold the stable handlebar.
import type { SideExercise } from '@/exercise.ts';
import { bicycle } from './_cardio-2.ts';

export default {
  ...bicycle({ en: 'Recumbent Bike', sources: ['fe:Recumbent_Bike'] }, '卧式健身车', 'recumbent'),
  id: 'recumbent-bike',
} satisfies SideExercise;
