// Hinge forward with a straight back and keep the working upper arm beside the torso.
// Extend the elbow backward against the low cable, then return under control.
import type { SideExercise } from '@/exercise.ts';
import { cableKickback } from './_triceps-extension-2.ts';

export default cableKickback({
  id: 'cable-single-arm-triceps-kickback', name: '绳索单臂俯身臂屈伸', single: true,
  meta: { en: 'Cable Single-Arm Triceps Kickback', family: 'triceps-extension', equipment: ['cable'], sources: ['hz:0860'] },
}) satisfies SideExercise;
