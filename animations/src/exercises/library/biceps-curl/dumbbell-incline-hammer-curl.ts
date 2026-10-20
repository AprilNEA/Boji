// The torso stays supported by a 45-degree incline bench while the arms hang beside it.
// The dumbbells curl toward the shoulders without moving the upper arms.
// The back or chest contact with the bench stays fixed throughout the repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-incline-hammer-curl",
  "name": "哑铃上斜锤式弯举",
  "en": "Dumbbell Incline Hammer Curl",
  "sources": [
    "fe:Incline_Hammer_Curls",
    "hz:0320"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "incline",
  "grip": "neutral"
}) satisfies import('@/exercise.ts').SideExercise;
