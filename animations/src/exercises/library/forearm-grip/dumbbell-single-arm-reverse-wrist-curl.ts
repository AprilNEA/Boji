// Sit with one overhand dumbbell forearm supported on the thigh and the wrist beyond the knee.
// Lower the dumbbell through the wrist, then curl it back toward the body while the elbow stays fixed.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellWristCurl } from './_forearm-grip-2.ts';

export default dumbbellWristCurl({
  id: 'dumbbell-single-arm-reverse-wrist-curl', name: '哑铃单臂反向腕弯举',
  en: 'Dumbbell Single-Arm Reverse Wrist Curl', sources: ['hz:0358'],
  reverse: true, unilateral: true, support: 'thigh',
}) satisfies SideExercise;
