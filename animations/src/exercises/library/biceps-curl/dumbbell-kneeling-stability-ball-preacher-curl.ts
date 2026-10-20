// Kneeling behind a stability ball, both elbows rest on the ball at its upper curve.
// The dumbbells curl toward the shoulders while the upper arms stay supported.
// The knees, ball and elbow supports remain fixed through the repetition.
import { makeBicepsCurl } from './_biceps-curl-3.ts';

export default makeBicepsCurl({
  "id": "dumbbell-kneeling-stability-ball-preacher-curl",
  "name": "哑铃跪姿健身球托臂弯举",
  "en": "Dumbbell Kneeling Stability Ball Preacher Curl",
  "sources": [
    "hz:1660"
  ],
  "equipment": [
    "dumbbell",
    "stability-ball"
  ],
  "mode": "ball-kneeling"
}) satisfies import('@/exercise.ts').SideExercise;
