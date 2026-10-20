// 从双脚髋宽运动姿势向侧方远跳。
// 双腿同时离地，手臂摆动引导方向。
// 双脚平行落地并屈膝缓冲。
import type { FrontExercise } from '@/exercise.ts';
import { frontPlyo } from './_plyometric-1.ts';

export default frontPlyo({
  id: 'standing-lateral-broad-jump', name: '立定侧向远跳', en: 'Standing Lateral Broad Jump',
  equipment: ['bodyweight'], sources: ['fe:Side_Standing_Long_Jump'],
}, 'lateral-broad') satisfies FrontExercise;
