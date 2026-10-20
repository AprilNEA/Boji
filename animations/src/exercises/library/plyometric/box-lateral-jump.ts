// 从箱体侧边向上横跳。
// 双脚同时落在箱面中央。
// 下箱后屈膝吸收冲击并继续横越。
import type { FrontExercise } from '@/exercise.ts';
import { frontPlyo } from './_plyometric-1.ts';

export default frontPlyo({
  id: 'box-lateral-jump', name: '侧向跳箱', en: 'Box Lateral Jump',
  equipment: ['box'], sources: ['fe:Lateral_Box_Jump'],
}, 'box-lateral') satisfies FrontExercise;
