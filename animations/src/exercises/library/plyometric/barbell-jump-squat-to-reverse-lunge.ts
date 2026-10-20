// 杠铃架在上背，先完成跳蹲。
// 落地后向后撤步，前腿下蹲。
// 前脚跟推地回到准备姿势。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'barbell-jump-squat-to-reverse-lunge', name: '杠铃跳蹲接后撤弓步蹲', en: 'Barbell Jump Squat to Reverse Lunge',
  equipment: ['barbell'], sources: ['hz:2798'],
}, 'barbell-lunge') satisfies SideExercise;
