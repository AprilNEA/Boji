// Press the chest and abdomen into the incline pad while the toes remain planted behind the bench.
// Let the neutral-grip dumbbells hang, then spread the soft elbows sideways until the arms are level.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-incline-bench-reverse-fly', name: '哑铃上斜俯卧反向飞鸟',
  en: 'Dumbbell Incline Bench Reverse Fly', sources: ['fe:Reverse_Flyes'],
}, { support: 'incline' }) satisfies FrontExercise;
