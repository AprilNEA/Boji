// Sit with feet flat and one dumbbell held above the head, keeping the working upper arm near the ear.
// Bend the working elbow to lower the weight behind the head, then straighten it fully.
import type { SideExercise } from '@/exercise.ts';
import { seatedOverheadExtension } from './_triceps-extension-2.ts';

export default seatedOverheadExtension({
  id: 'dumbbell-seated-single-arm-overhead-triceps-extension', name: '坐姿哑铃单臂颈后臂屈伸', single: true,
  meta: { en: 'Dumbbell Seated Single-Arm Overhead Triceps Extension', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['hz:0362'] },
}) satisfies SideExercise;
