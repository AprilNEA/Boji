// 从固定前后开立的弓步蹲开始。
// 双腿同时蹬地，空中将双脚收近。
// 落地回到相同前后站位。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'bodyweight-split-squat-jump', name: '自重分腿蹲跳', en: 'Bodyweight Split Squat Jump',
  equipment: ['bodyweight'], sources: ['fe:Split_Jump'],
}, 'split-jump') satisfies SideExercise;
