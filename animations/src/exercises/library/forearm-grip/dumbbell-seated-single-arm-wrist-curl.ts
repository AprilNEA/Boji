// Sit on a flat bench with one palm-up forearm against the upper thigh and the wrist past the knee.
// The dumbbell rolls down toward the fingers, then flexes back toward the forearm without elbow motion.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellWristCurl } from './_forearm-grip-2.ts';

export default dumbbellWristCurl({
  id: 'dumbbell-seated-single-arm-wrist-curl', name: '哑铃坐姿单臂腕弯举',
  en: 'Dumbbell Seated Single-Arm Wrist Curl', sources: ['fe:Seated_One-Arm_Dumbbell_Palms-Up_Wrist_Curl', 'hz:0364'],
  reverse: false, unilateral: true, support: 'thigh',
}) satisfies SideExercise;
