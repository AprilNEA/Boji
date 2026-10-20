// 从半蹲与手臂贴身的姿势开始。
// 起跳时双腿伸展并向头顶充分伸手。
// 落地收臂屈膝保持平衡。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'rocket-jump', name: '火箭跳', en: 'Rocket Jump',
  equipment: ['bodyweight'], sources: ['fe:Rocket_Jump'],
}, 'rocket') satisfies SideExercise;
