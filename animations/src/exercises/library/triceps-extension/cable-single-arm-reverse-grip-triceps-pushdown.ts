// Stand at the high pulley with the working elbow fixed beside the torso.
// Use a supinated single-handle grip and extend the elbow down to a straight arm.
import type { SideExercise } from '@/exercise.ts';
import { cablePushdown } from './_triceps-extension-2.ts';

export default cablePushdown({
  id: 'cable-single-arm-reverse-grip-triceps-pushdown', name: '绳索单臂反握下压', attachment: 'bar', single: true,
  meta: { en: 'Cable Single-Arm Reverse-Grip Triceps Pushdown', family: 'triceps-extension', equipment: ['cable'], sources: ['fe:Cable_One_Arm_Tricep_Extension'] },
}) satisfies SideExercise;
