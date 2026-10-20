// The torso stays supported by a 45-degree incline bench while the arms hang beside it.
// The dumbbells curl toward the shoulders without moving the upper arms.
// The back or chest contact with the bench stays fixed throughout the repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-prone-incline-curl",
  "name": "哑铃上斜俯卧弯举",
  "en": "Dumbbell Prone Incline Curl",
  "sources": [
    "fe:Dumbbell_Prone_Incline_Curl"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "prone"
}) satisfies import('@/exercise.ts').SideExercise;
