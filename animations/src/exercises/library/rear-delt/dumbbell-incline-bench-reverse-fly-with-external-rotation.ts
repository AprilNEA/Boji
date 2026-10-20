// Support the chest on a low incline with the dumbbells hanging below the shoulders and elbows softly bent.
// Fly the arms sideways and externally rotate the wrists to neutral at the top before lowering.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-incline-bench-reverse-fly-with-external-rotation', name: '哑铃上斜俯卧反向飞鸟接外旋',
  en: 'Dumbbell Incline Bench Reverse Fly with External Rotation', sources: ['fe:Reverse_Flyes_With_External_Rotation'],
}, { support: 'incline', rotation: true }) satisfies FrontExercise;
