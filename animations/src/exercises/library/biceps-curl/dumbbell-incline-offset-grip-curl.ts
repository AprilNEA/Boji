// The back stays supported by a 45-degree incline bench and the arms hang beside it.
// Both offset-grip dumbbells curl to the shoulders with extended, palm-up wrists.
// The upper arms, back contact and feet remain fixed through the controlled curl.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-incline-offset-grip-curl",
  "name": "哑铃上斜偏握弯举",
  "en": "Dumbbell Incline Offset-Grip Curl",
  "sources": [
    "fe:Flexor_Incline_Dumbbell_Curls"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "incline",
  "offsetGrip": true
}) satisfies import('@/exercise.ts').SideExercise;
