// 从单脚轻屈膝站姿横向起跳。
// 非支撑腿在落地时交叉到身后轻点。
// 支撑腿吸收冲击后立即反向起跳。
import type { FrontExercise } from '@/exercise.ts';
import { frontPlyo } from './_plyometric-1.ts';

export default frontPlyo({
  id: 'bodyweight-skater-hop', name: '自重滑冰跳', en: 'Bodyweight Skater Hop',
  equipment: ['bodyweight'], sources: ['hz:3361', 'hz:3671'],
}, 'skater') satisfies FrontExercise;
