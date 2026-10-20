// 双手胸前向前伸，掌心向下。
// 起跳时双膝上驱靠近手掌。
// 落地前伸腿，再屈膝吸收冲击。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'tuck-jump', name: '收腹跳', en: 'Tuck Jump',
  equipment: ['bodyweight'], sources: ['fe:Knee_Tuck_Jump'],
}, 'tuck') satisfies SideExercise;
