// Standing or seated upright, the elbows stay beside the torso and the upper arms remain still.
// The dumbbells curl from a long arm to shoulder height through elbow flexion.
// The torso and lower-body support remain fixed through each repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-hammer-curl",
  "name": "哑铃锤式弯举",
  "en": "Dumbbell Hammer Curl",
  "sources": [
    "fe:Hammer_Curls",
    "hz:0313",
    "hz:0312"
  ],
  "equipment": [
    "dumbbell"
  ],
  "mode": "standing",
  "grip": "neutral"
}) satisfies import('@/exercise.ts').SideExercise;
