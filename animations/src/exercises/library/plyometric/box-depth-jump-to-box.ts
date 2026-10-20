// 从低箱边缘双脚站立开始。
// 下落后立即反弹，跳上前方高箱。
// 高箱上双脚屈膝着陆。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'box-depth-jump-to-box', name: '跳箱跳深接跳箱', en: 'Box Depth Jump to Box',
  equipment: ['box'], sources: ['fe:Depth_Jump_Leap', 'fe:Linear_Depth_Jump'],
}, 'box-depth') satisfies SideExercise;
