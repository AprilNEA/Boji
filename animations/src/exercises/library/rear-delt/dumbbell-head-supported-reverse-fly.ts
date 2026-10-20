// Rest the forehead on the incline support and keep the neutral spine and hip hinge fixed.
// Lift both soft elbows directly sideways to shoulder height, pause, then lower the dumbbells under control.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-head-supported-reverse-fly', name: '哑铃头部支撑俯身反向飞鸟',
  en: 'Dumbbell Head-Supported Reverse Fly', sources: ['fe:Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench', 'hz:0379'],
}, { support: 'head' }) satisfies FrontExercise;
