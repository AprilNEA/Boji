// 从轻屈膝站姿垂直起跳。
// 空中屈膝，让双脚跟靠近臀部。
// 落地前伸腿，再以半蹲缓冲。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'double-leg-butt-kick-jump', name: '双腿后踢臀跳', en: 'Double-Leg Butt Kick Jump',
  equipment: ['bodyweight'], sources: ['fe:Double_Leg_Butt_Kick'],
}, 'butt-kick') satisfies SideExercise;
