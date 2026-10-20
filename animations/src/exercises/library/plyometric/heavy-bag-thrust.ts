// 双脚前后站立在沙袋侧方。
// 胸高位置爆发推击沙袋，并转动躯干。
// 沙袋回摆时屈肘接住并回到准备位。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'heavy-bag-thrust', name: '沙袋爆发推击', en: 'Heavy Bag Thrust',
  equipment: ['other'], sources: ['fe:Heavy_Bag_Thrust'],
}, 'heavy-bag') satisfies SideExercise;
