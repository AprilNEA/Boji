// 从弓步蹲底部起跳，并在空中交换前后腿。
// 落地时回到反向弓步蹲。
// 前膝保持在脚掌上方。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'bodyweight-alternating-split-squat-jump', name: '自重交替分腿蹲跳', en: 'Bodyweight Alternating Split Squat Jump',
  equipment: ['bodyweight'], sources: ['fe:Split_Squats'],
}, 'lunge-switch') satisfies SideExercise;
