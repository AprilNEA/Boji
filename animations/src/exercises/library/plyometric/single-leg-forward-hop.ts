// 单脚平衡，另一腿屈膝抬起。
// 支撑脚连续向前跳过锥桶。
// 每次都以同一支撑脚轻柔落地。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'single-leg-forward-hop', name: '单腿向前跳', en: 'Single-Leg Forward Hop',
  equipment: ['bodyweight'], sources: ['fe:Single-Leg_Hop_Progression'],
}, 'single-hop') satisfies SideExercise;
