// Standing or seated upright, the elbows stay beside the torso and the upper arms remain still.
// The dumbbells curl from a long arm to shoulder height through elbow flexion.
// The torso and lower-body support remain fixed through each repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-biceps-curl",
  "name": "哑铃弯举",
  "en": "Dumbbell Biceps Curl",
  "sources": [
    "fe:Dumbbell_Bicep_Curl",
    "hz:0294"
  ],
  "equipment": [
    "dumbbell"
  ],
  "mode": "standing"
}) satisfies import('@/exercise.ts').SideExercise;
