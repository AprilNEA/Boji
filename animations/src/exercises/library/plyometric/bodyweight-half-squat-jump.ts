// 从半蹲深度快速垂直起跳。
// 髋、膝、踝充分伸展并摆臂。
// 落地后回到半蹲。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'bodyweight-half-squat-jump', name: '自重半蹲跳', en: 'Bodyweight Half Squat Jump',
  equipment: ['bodyweight'], sources: ['hz:3222'],
}, 'half-squat') satisfies SideExercise;
