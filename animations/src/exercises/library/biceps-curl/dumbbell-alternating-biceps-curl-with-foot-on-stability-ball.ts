// Standing on one planted foot, the rear foot rests on top of a stability ball.
// Each dumbbell curls to shoulder height while the upper arm stays by the torso.
// The supporting foot, ball contact and upright torso remain fixed.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-alternating-biceps-curl-with-foot-on-stability-ball",
  "name": "哑铃单脚搭健身球交替弯举",
  "en": "Dumbbell Alternating Biceps Curl with Foot on Stability Ball",
  "sources": [
    "hz:1649"
  ],
  "equipment": [
    "dumbbell",
    "stability-ball"
  ],
  "mode": "ball-standing",
  "grip": "supinated",
  "alternating": true
}) satisfies import('@/exercise.ts').SideExercise;
