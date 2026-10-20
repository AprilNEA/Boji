// 从半蹲姿势侧向跨跳。
// 外侧腿蹬地，另一腿抬起辅助平衡。
// 单脚落地后保持膝盖柔软。
import type { FrontExercise } from '@/exercise.ts';
import { frontPlyo } from './_plyometric-1.ts';

export default frontPlyo({
  id: 'lateral-bound', name: '侧向跨跳', en: 'Lateral Bound',
  equipment: ['bodyweight'], sources: ['fe:Lateral_Bound'],
}, 'lateral-bound') satisfies FrontExercise;
