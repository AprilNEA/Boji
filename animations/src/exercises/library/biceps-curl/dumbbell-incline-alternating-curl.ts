// The back stays supported by a 45-degree incline bench while the arms hang beside it.
// Each dumbbell turns from neutral to palm-up as it curls toward the shoulder.
// The upper arms, back contact and feet remain fixed through the alternating curls.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-incline-alternating-curl",
  "name": "哑铃上斜交替弯举",
  "en": "Dumbbell Incline Alternating Curl",
  "sources": [
    "fe:Alternate_Incline_Dumbbell_Curl"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "incline",
  "grip": "supinated",
  "supinate": true,
  "alternating": true
}) satisfies import('@/exercise.ts').SideExercise;
