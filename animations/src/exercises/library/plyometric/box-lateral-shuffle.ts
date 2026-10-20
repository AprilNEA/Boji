// 一脚在箱面，另一脚在地面开始。
// 横移起跳时交换箱面脚和地面脚。
// 箱面脚保持在箱体中央。
import type { FrontExercise } from '@/exercise.ts';
import { frontPlyo } from './_plyometric-1.ts';

export default frontPlyo({
  id: 'box-lateral-shuffle', name: '箱上左右交替跳', en: 'Box Lateral Shuffle',
  equipment: ['box'], sources: ['fe:Side_to_Side_Box_Shuffle'],
}, 'box-shuffle') satisfies FrontExercise;
