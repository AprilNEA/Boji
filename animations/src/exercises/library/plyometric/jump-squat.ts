// 双臂交叉胸前，从平行深蹲开始。
// 通过前脚掌快速伸髋伸膝起跳。
// 落地即回到深蹲，背部中立。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'jump-squat', name: '深蹲跳', en: 'Jump Squat',
  equipment: ['bodyweight'], sources: ['fe:Freehand_Jump_Squat', 'hz:0514', 'hz:0513'],
}, 'jump-squat') satisfies SideExercise;
