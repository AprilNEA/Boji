// 跪姿坐向脚跟，双手在肩旁握住上背杠铃。
// 髋部爆发伸展，双脚同时落地。
// 以深蹲姿势吸收冲击后站起。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'barbell-kneeling-jump-squat', name: '杠铃跪姿跳起深蹲', en: 'Barbell Kneeling Jump Squat',
  equipment: ['barbell'], sources: ['fe:Kneeling_Jump_Squat', 'hz:1420'],
}, 'kneeling-barbell') satisfies SideExercise;
