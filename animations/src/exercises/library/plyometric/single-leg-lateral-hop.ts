// 从单脚微屈膝姿势横越锥桶。
// 每次都在同一只脚上起跳和落地。
// 另一腿离地以维持平衡。
import type { FrontExercise } from '@/exercise.ts';
import { frontPlyo } from './_plyometric-1.ts';

export default frontPlyo({
  id: 'single-leg-lateral-hop', name: '单腿侧向跳', en: 'Single-Leg Lateral Hop',
  equipment: ['bodyweight'], sources: ['fe:Single-Leg_Lateral_Hop'],
}, 'single-lateral-hop') satisfies FrontExercise;
