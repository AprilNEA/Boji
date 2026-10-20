// 双脚并拢在锥桶侧方小半蹲。
// 双脚同时横向跳过锥桶。
// 每次落地后屈膝并快速反弹。
import type { FrontExercise } from '@/exercise.ts';
import { frontPlyo } from './_plyometric-1.ts';

export default frontPlyo({
  id: 'lateral-cone-hops', name: '侧向跳锥', en: 'Lateral Cone Hops',
  equipment: ['other'], sources: ['fe:Lateral_Cone_Hops'],
}, 'cone-hops') satisfies FrontExercise;
