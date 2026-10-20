// Bend one elbow with the hand behind the head. The other hand pulls the raised elbow gently.
// The stretch eases into a long hold, returns to neutral, and repeats on the other side when unilateral.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'overhead-triceps-stretch', name: '过顶肱三头肌拉伸', en: 'Overhead Triceps Stretch', equipment: ['bodyweight'], sources: ['fe:Triceps_Stretch', 'hz:0643', 'hz:0817'],
}, 'overhead-triceps', [{ m: 'triceps', side: 'near' }, { m: 'lats', scale: 0.35 }, { m: 'delts', side: 'near', scale: 0.3 }]) satisfies SideExercise;
