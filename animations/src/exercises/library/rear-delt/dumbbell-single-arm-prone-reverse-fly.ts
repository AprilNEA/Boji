// Lie chest-down on the flat bench with the free arm fixed on the support and the loaded arm hanging.
// Lift the straight loaded arm out to the side until level with the shoulder, then return under control.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-single-arm-prone-reverse-fly', name: '哑铃单臂俯卧反向飞鸟',
  en: 'Dumbbell Single-Arm Prone Reverse Fly', sources: ['hz:0345'],
}, { support: 'flat', unilateral: true, straight: true }) satisfies FrontExercise;
