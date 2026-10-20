// 从弓步蹲底部起跳，并在空中交换前后腿。
// 落地时回到反向弓步蹲。
// 前膝保持在脚掌上方。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'alternating-jump-lunge', name: '交替弓步跳', en: 'Alternating Jump Lunge',
  equipment: ['bodyweight'], sources: ['hz:3582'],
}, 'lunge-switch') satisfies SideExercise;
