// 双脚髋宽、轻屈膝后向后起跳。
// 双脚同时离地。
// 以前脚掌轻落地并屈膝缓冲。
import type { SideExercise } from '@/exercise.ts';
import { sidePlyo } from './_plyometric-1.ts';

export default sidePlyo({
  id: 'backward-jump', name: '后跳', en: 'Backward Jump',
  equipment: ['bodyweight'], sources: ['hz:1473'],
}, 'backward') satisfies SideExercise;
