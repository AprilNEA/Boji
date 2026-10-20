// Seated forward on a flat bench, the working elbow stays braced against the inner thigh.
// The dumbbell curls from a long arm toward the shoulder without swinging the upper arm.
// Both feet and the bench contact stay fixed through the repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-seated-single-arm-hammer-curl",
  "name": "坐姿哑铃单臂锤式弯举",
  "en": "Dumbbell Seated Single-Arm Hammer Curl",
  "sources": [
    "hz:1669"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "concentration",
  "grip": "neutral"
}) satisfies import('@/exercise.ts').SideExercise;
