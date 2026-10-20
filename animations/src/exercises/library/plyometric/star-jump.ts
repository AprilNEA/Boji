// 从半蹲、手臂贴身的姿势开始。
// 腾空时四肢向外张开形成星形。
// 落地前收回四肢并屈膝缓冲。
import type { FrontExercise } from '@/exercise.ts';
import { frontPlyo } from './_plyometric-1.ts';

export default frontPlyo({
  id: 'star-jump', name: '星形跳', en: 'Star Jump',
  equipment: ['bodyweight'], sources: ['fe:Star_Jump', 'hz:3220', 'hz:3223'],
}, 'star') satisfies FrontExercise;
