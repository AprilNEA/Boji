// Stand tall with the dumbbells beside the thighs and the elbows close to the ribs.
// Each arm alternates from a neutral grip to a palm-up curl at shoulder height.
// The upper arms, torso and planted feet remain fixed through each curl.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-alternating-biceps-curl",
  "name": "哑铃交替弯举",
  "en": "Dumbbell Alternating Biceps Curl",
  "sources": [
    "fe:Dumbbell_Alternate_Bicep_Curl",
    "hz:0285"
  ],
  "equipment": [
    "dumbbell"
  ],
  "mode": "standing",
  "grip": "supinated",
  "supinate": true,
  "alternating": true
}) satisfies import('@/exercise.ts').SideExercise;
