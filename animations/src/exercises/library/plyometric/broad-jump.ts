// 从半蹲开始，手臂后摆。
// 手臂前摆时双腿向前爆发蹬跳。
// 双脚在身体前方轻落地。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'broad-jump', name: '立定跳远', en: 'Broad Jump',
  equipment: ['bodyweight'], sources: ['hz:1472'],
}, 'broad') satisfies SideExercise;
