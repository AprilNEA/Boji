// Face away from a low pulley with the working upper arm vertical beside the ear.
// The free hand braces the elbow while the handle moves behind the head and back overhead.
import type { SideExercise } from '@/exercise.ts';
import { cableOverheadExtension } from './_triceps-extension-2.ts';

export default cableOverheadExtension({
  id: 'cable-standing-single-arm-overhead-triceps-extension', name: '绳索站姿单臂颈后臂屈伸', single: true,
  meta: { en: 'Cable Standing Single-Arm Overhead Triceps Extension', family: 'triceps-extension', equipment: ['cable'], sources: ['fe:Standing_Low-Pulley_One-Arm_Triceps_Extension', 'hz:0231'] },
}) satisfies SideExercise;
