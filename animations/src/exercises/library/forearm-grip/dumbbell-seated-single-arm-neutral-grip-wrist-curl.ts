// Sit with one palm-up forearm resting on the thigh and the wrist extending beyond the knee.
// The source directs wrist flexion toward the forearm, then a slow return while the forearm stays stationary.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellWristCurl } from './_forearm-grip-2.ts';

export default dumbbellWristCurl({
  id: 'dumbbell-seated-single-arm-neutral-grip-wrist-curl', name: '坐姿哑铃单臂腕弯举',
  en: 'Dumbbell Seated Single-Arm Neutral-Grip Wrist Curl', sources: ['hz:1415'],
  reverse: false, unilateral: true, support: 'thigh',
}) satisfies SideExercise;
