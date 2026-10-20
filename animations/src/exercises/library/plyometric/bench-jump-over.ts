// 在凳子一侧半蹲，双脚同时起跳越过凳面。
// 手臂向前上方摆动。
// 另一侧双脚屈膝落地后反向重复。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'bench-jump-over', name: '跳跃越凳', en: 'Bench Jump-Over',
  equipment: ['bench'], sources: ['fe:Bench_Jump'],
}, 'bench-over') satisfies SideExercise;
