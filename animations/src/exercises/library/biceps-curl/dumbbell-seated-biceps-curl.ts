// Standing or seated upright, the elbows stay beside the torso and the upper arms remain still.
// The dumbbells curl from a long arm to shoulder height through elbow flexion.
// The torso and lower-body support remain fixed through each repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-seated-biceps-curl",
  "name": "哑铃坐姿弯举",
  "en": "Dumbbell Seated Biceps Curl",
  "sources": [
    "hz:1677",
    "hz:0391"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "seated"
}) satisfies import('@/exercise.ts').SideExercise;
