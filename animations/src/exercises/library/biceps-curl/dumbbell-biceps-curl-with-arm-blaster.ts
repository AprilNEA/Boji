// Standing or seated upright, the elbows stay beside the torso and the upper arms remain still.
// The dumbbells curl from a long arm to shoulder height through elbow flexion.
// The torso and lower-body support remain fixed through each repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-biceps-curl-with-arm-blaster",
  "name": "哑铃弯举板弯举",
  "en": "Dumbbell Biceps Curl with Arm Blaster",
  "sources": [
    "hz:2401"
  ],
  "equipment": [
    "dumbbell",
    "other"
  ],
  "mode": "standing",
  "grip": "supinated",
  "armBlaster": true
}) satisfies import('@/exercise.ts').SideExercise;
