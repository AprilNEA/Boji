// 一条腿支撑，另一腿屈膝抬起。
// 支撑脚起跳后快速屈膝，让脚跟靠近臀部。
// 对侧抬膝保持稳定。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'single-leg-butt-kick-jump', name: '单腿后踢臀跳', en: 'Single-Leg Butt Kick Jump',
  equipment: ['bodyweight'], sources: ['fe:Single_Leg_Butt_Kick'],
}, 'single-butt-kick') satisfies SideExercise;
