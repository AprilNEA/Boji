// Sit on the bicycle saddle with both hands on the handlebar and feet on the pedals.
// Alternate the pedal strokes smoothly while keeping the trunk balanced over the frame.
import type { SideExercise } from '@/exercise.ts';
import { bicycle } from './_cardio-2.ts';

export default {
  ...bicycle({ en: 'Bicycle Riding', sources: ['fe:Bicycling'] }, '自行车骑行', 'road'),
  id: 'bicycle-riding',
} satisfies SideExercise;
