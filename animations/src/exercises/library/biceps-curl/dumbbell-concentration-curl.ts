// Seated forward on a flat bench, the working elbow stays braced against the inner thigh.
// The dumbbell curls from a long arm toward the shoulder without swinging the upper arm.
// Both feet and the bench contact stay fixed through the repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-concentration-curl",
  "name": "哑铃集中弯举",
  "en": "Dumbbell Concentration Curl",
  "sources": [
    "fe:Concentration_Curls",
    "hz:0297"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "concentration"
}) satisfies import('@/exercise.ts').SideExercise;
