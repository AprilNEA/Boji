// Seated forward on a flat bench, the working elbow stays braced against the inner thigh.
// The overhand dumbbell curls from a long arm toward the shoulder without swinging the upper arm.
// Both feet and the bench contact stay fixed through the repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-seated-reverse-grip-concentration-curl",
  "name": "哑铃坐姿反握集中弯举",
  "en": "Dumbbell Seated Reverse-Grip Concentration Curl",
  "sources": [
    "hz:0403"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "concentration",
  "grip": "pronated"
}) satisfies import('@/exercise.ts').SideExercise;
