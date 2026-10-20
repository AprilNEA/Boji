// Start tall with both dumbbells at the sides and the soles planted.
// Curl both weights to shoulder height, then squat while holding the curl.
// The elbows stay beside the torso and the feet stay fixed through the sequence.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-biceps-curl-to-squat",
  "name": "哑铃弯举接深蹲",
  "en": "Dumbbell Biceps Curl to Squat",
  "sources": [
    "hz:1655"
  ],
  "equipment": [
    "dumbbell"
  ],
  "mode": "curl-squat"
}) satisfies import('@/exercise.ts').SideExercise;
