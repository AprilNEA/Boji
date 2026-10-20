// Standing or seated upright, the elbows stay beside the torso and the upper arms remain still.
// The dumbbells curl from a long arm to shoulder height through elbow flexion.
// The torso and lower-body support remain fixed through each repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-arm-blaster-hammer-curl",
  "name": "哑铃弯举板锤式弯举",
  "en": "Dumbbell Arm Blaster Hammer Curl",
  "sources": [
    "hz:2402"
  ],
  "equipment": [
    "dumbbell",
    "other"
  ],
  "mode": "standing",
  "grip": "neutral",
  "armBlaster": true
}) satisfies import('@/exercise.ts').SideExercise;
