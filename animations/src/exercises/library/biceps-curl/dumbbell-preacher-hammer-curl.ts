// Seated behind a preacher bench, both upper arms stay supported on its sloping pad.
// The dumbbells move only by elbow flexion from a long arm to a contracted curl.
// The chest, pad contact and seated feet remain fixed.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-preacher-hammer-curl",
  "name": "哑铃牧师凳锤式弯举",
  "en": "Dumbbell Preacher Hammer Curl",
  "sources": [
    "fe:Preacher_Hammer_Dumbbell_Curl",
    "hz:0370"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "preacher",
  "grip": "neutral"
}) satisfies import('@/exercise.ts').SideExercise;
