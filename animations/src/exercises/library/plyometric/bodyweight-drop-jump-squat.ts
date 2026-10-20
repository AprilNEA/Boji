// 从髋宽准备姿势下蹲后爆发起跳。
// 腾空时双脚靠拢。
// 前脚掌轻落地后立即下沉。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'bodyweight-drop-jump-squat', name: '自重落地跳跃深蹲', en: 'Bodyweight Drop Jump Squat',
  equipment: ['bodyweight'], sources: ['hz:3543'],
}, 'drop-jump') satisfies SideExercise;
