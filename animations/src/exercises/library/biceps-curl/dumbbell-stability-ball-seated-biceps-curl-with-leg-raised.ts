// Seated bilateral curl with one raised leg on a stability ball, side view. The torso remains upright on the ball.
// One leg stays extended off the floor while both elbows curl from about 165° to 45°.
// The other foot remains planted and the dumbbells travel with both hands.
import type { SideExercise } from '@/exercise.ts';
import { makeBallCurl } from './_biceps-curl-4.ts';

export default makeBallCurl({
  id: 'dumbbell-stability-ball-seated-biceps-curl-with-leg-raised',
  name: '健身球坐姿抬腿哑铃弯举',
  en: 'Dumbbell Stability Ball Seated Biceps Curl with Leg Raised',
  sources: ['hz:1652'],
  bilateral: true,
  raisedLeg: true,
}) satisfies SideExercise;
