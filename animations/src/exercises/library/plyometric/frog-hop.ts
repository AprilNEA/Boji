// 双手置于头后，躯干抬起地深蹲。
// 双腿向前做低而远的跳跃。
// 双脚落地后立即缓冲并连续跳。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'frog-hop', name: '蛙跳', en: 'Frog Hop',
  equipment: ['bodyweight'], sources: ['fe:Frog_Hops'],
}, 'frog') satisfies SideExercise;
