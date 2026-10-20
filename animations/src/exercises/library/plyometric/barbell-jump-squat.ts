// 轻杠铃架在上背，从小幅下蹲开始。
// 髋、膝、踝同时伸展，双脚垂直起跳。
// 落地时杠铃稳定，髋膝屈曲缓冲。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'barbell-jump-squat', name: '杠铃跳跃深蹲', en: 'Barbell Jump Squat',
  equipment: ['barbell'], sources: ['hz:0053', 'fe:Weighted_Jump_Squat'],
}, 'barbell-jump') satisfies SideExercise;
