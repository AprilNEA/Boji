// Parallel-bar triceps dip, side view. The torso stays upright and the palms maintain their fixed bar contact.
// The elbows stay close, bend to about 90°, and then extend to a nearly locked supported position.
import type { SideExercise } from '@/exercise.ts';
import { suspendedDip } from './_dip.ts';

export default suspendedDip({
  id: 'parallel-bar-triceps-dip', name: '双杠直立臂屈伸', en: 'Parallel Bar Triceps Dip', equipment: ['dip-station'],
  sources: ['fe:Dips_-_Triceps_Version'],
}, 'triceps') satisfies SideExercise;
