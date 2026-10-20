// Seated behind a preacher bench, both upper arms stay supported on its sloping pad.
// The dumbbells move only by elbow flexion from a long arm to a contracted curl.
// The chest, pad contact and seated feet remain fixed.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-reverse-preacher-curl",
  "name": "哑铃反握牧师凳弯举",
  "en": "Dumbbell Reverse Preacher Curl",
  "sources": [
    "hz:0384"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "preacher",
  "grip": "pronated"
}) satisfies import('@/exercise.ts').SideExercise;
