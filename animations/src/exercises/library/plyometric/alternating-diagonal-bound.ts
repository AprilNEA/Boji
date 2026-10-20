// 从交错站姿向两侧斜向跨跳，并在单脚上交替落地。
// 摆动腿在空中主动抬膝。
// 每次落地都屈髋屈膝并保持支撑脚着地。
import type { FrontExercise } from '@/exercise.ts';
import { frontPlyo } from './_plyometric-1.ts';

export default frontPlyo({
  id: 'alternating-diagonal-bound', name: '交替斜向跨跳', en: 'Alternating Diagonal Bound',
  equipment: ['bodyweight'], sources: ['fe:Alternate_Leg_Diagonal_Bound'],
}, 'diagonal-bound') satisfies FrontExercise;
