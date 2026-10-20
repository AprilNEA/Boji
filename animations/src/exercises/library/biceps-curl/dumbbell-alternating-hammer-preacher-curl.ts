// Seated behind a preacher bench, both upper arms stay supported on its sloping pad.
// The dumbbells move only by elbow flexion from a long arm to a contracted curl.
// The chest, pad contact and seated feet remain fixed.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-alternating-hammer-preacher-curl",
  "name": "哑铃交替锤式牧师凳弯举",
  "en": "Dumbbell Alternating Hammer Preacher Curl",
  "sources": [
    "hz:1646"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "preacher",
  "grip": "neutral",
  "alternating": true
}) satisfies import('@/exercise.ts').SideExercise;
