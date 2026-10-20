// 一脚在箱面，另一脚在地面开始。
// 起跳越过箱体并交换上下位置。
// 对侧脚落在箱面，另一脚落在箱旁。
import type { FrontExercise } from '@/exercise.ts';
import { frontPlyo } from './_plyometric-1.ts';

export default frontPlyo({
  id: 'box-crossover-jump', name: '跳箱交替侧向跳', en: 'Box Crossover Jump',
  equipment: ['box'], sources: ['fe:Stride_Jump_Crossover'],
}, 'box-crossover') satisfies FrontExercise;
