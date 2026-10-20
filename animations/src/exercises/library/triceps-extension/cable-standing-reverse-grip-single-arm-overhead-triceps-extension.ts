// Face away from the low pulley with one upper arm vertical beside the head.
// Lower the reverse-grip handle behind the head, then straighten the working elbow.
import type { SideExercise } from '@/exercise.ts';
import { cableOverheadExtension } from './_triceps-extension-2.ts';

export default cableOverheadExtension({
  id: 'cable-standing-reverse-grip-single-arm-overhead-triceps-extension', name: '绳索站姿反握单臂过顶臂屈伸', single: true,
  meta: { en: 'Cable Standing Reverse-Grip Single-Arm Overhead Triceps Extension', family: 'triceps-extension', equipment: ['cable'], sources: ['hz:1727'] },
}) satisfies SideExercise;
