// Sit upright with one underhand forearm resting on the thigh and the wrist just beyond the knee.
// The dumbbell rolls toward the fingertips, then the fingers close it back into the palm without elbow motion.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellFingerCurl } from './_forearm-grip-2.ts';

export default dumbbellFingerCurl({
  id: 'dumbbell-finger-curl', name: '哑铃手指弯举', en: 'Dumbbell Finger Curl', sources: ['hz:1437'],
}) satisfies SideExercise;
