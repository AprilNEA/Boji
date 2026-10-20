// Stand with shoulder-width feet and lower by bending the knees and moving the hips back.
// Rise to reach overhead and rotate the torso to alternating sides.
// Both feet remain planted throughout each squat.
import { makeTwistReachSquat } from './_squat-1.ts';

export default makeTwistReachSquat({
  id: 'bodyweight-squat-to-overhead-reach-with-twist',
  name: '徒手深蹲上举转体',
  en: 'Bodyweight Squat to Overhead Reach with Twist',
  equipment: ['bodyweight'],
  sources: ['hz:1686'],
}) satisfies import('@/exercise.ts').FrontExercise;
