// The torso stays supported by a 45-degree incline bench while the arms hang beside it.
// The dumbbells curl toward the shoulders without moving the upper arms.
// The back or chest contact with the bench stays fixed throughout the repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-incline-curl",
  "name": "哑铃上斜弯举",
  "en": "Dumbbell Incline Curl",
  "sources": [
    "fe:Incline_Dumbbell_Curl",
    "hz:0315",
    "hz:0318",
    "hz:0317"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "incline"
}) satisfies import('@/exercise.ts').SideExercise;
