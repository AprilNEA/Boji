// Standing or seated upright, the elbows stay beside the torso and the upper arms remain still.
// The dumbbells curl from a long arm to shoulder height through elbow flexion.
// The torso and lower-body support remain fixed through each repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-reverse-curl",
  "name": "哑铃反握弯举",
  "en": "Dumbbell  Reverse Curl",
  "sources": [
    "hz:1654",
    "hz:0382"
  ],
  "equipment": [
    "dumbbell"
  ],
  "mode": "standing",
  "grip": "pronated"
}) satisfies import('@/exercise.ts').SideExercise;
