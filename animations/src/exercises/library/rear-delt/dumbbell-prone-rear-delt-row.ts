// Keep the chest supported on a flat bench with both dumbbells hanging below the shoulders.
// Pull the elbows high and wide toward the upper chest, squeeze the shoulder blades, then lower smoothly.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-prone-rear-delt-row', name: '哑铃俯卧后三角划船',
  en: 'Dumbbell Prone Rear Delt Row', sources: ['hz:1328'],
}, { support: 'flat', row: true }) satisfies FrontExercise;
