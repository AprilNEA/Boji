// Standing or seated upright, the elbows stay beside the torso and the upper arms remain still.
// The dumbbells curl from a long arm to shoulder height through elbow flexion.
// The torso and lower-body support remain fixed through each repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-seated-alternating-hammer-curl",
  "name": "哑铃坐姿交替锤式弯举",
  "en": "Dumbbell Seated Alternating Hammer Curl",
  "sources": [
    "hz:1648"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "seated",
  "grip": "neutral",
  "alternating": true
}) satisfies import('@/exercise.ts').SideExercise;
