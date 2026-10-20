// Sit on a flat bench with one pronated forearm placed on the upper thigh and wrist over the knee.
// The dumbbell lowers under a firm grip, then rises through wrist extension without elbow movement.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellWristCurl } from './_forearm-grip-2.ts';

export default dumbbellWristCurl({
  id: 'dumbbell-seated-single-arm-reverse-wrist-curl', name: '哑铃坐姿单臂反向腕弯举',
  en: 'Dumbbell Seated Single-Arm Reverse Wrist Curl', sources: ['fe:Seated_One-Arm_Dumbbell_Palms-Down_Wrist_Curl'],
  reverse: true, unilateral: true, support: 'thigh',
}) satisfies SideExercise;
