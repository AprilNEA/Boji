// Seated upright with both feet planted, the dumbbells first curl to the shoulders.
// The wrists rotate into a press position, then both weights travel overhead.
// The torso, bench contact and feet remain fixed through the full compound repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-seated-biceps-curl-to-shoulder-press",
  "name": "哑铃坐姿弯举接肩上推举",
  "en": "Dumbbell Seated Biceps Curl to Shoulder Press",
  "sources": [
    "hz:3547"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "seated-press"
}) satisfies import('@/exercise.ts').SideExercise;
