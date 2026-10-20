// Sit tall with the dumbbells beside the thighs and both soles on the floor.
// Both wrists turn from neutral to palm-up as the dumbbells curl to shoulder height.
// The upper arms, torso, bench contact and feet remain fixed through the curl.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-seated-curl",
  "name": "哑铃坐姿弯举",
  "en": "Dumbbell Seated Curl",
  "sources": [
    "fe:Seated_Dumbbell_Curl"
  ],
  "equipment": [
    "dumbbell",
    "bench"
  ],
  "mode": "seated",
  "supinate": true
}) satisfies import('@/exercise.ts').SideExercise;
