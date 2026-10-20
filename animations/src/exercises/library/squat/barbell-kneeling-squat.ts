// Kneel on a mat with the bar tight across the upper back and the torso upright.
// Sit the hips back toward the calves, then extend the hips to return to tall kneeling.
// Both knees remain supported on the mat throughout the repetition.
import { makeKneelingSquat } from './_squat-1.ts';

export default makeKneelingSquat({
  id: 'barbell-kneeling-squat',
  name: '杠铃跪姿深蹲',
  en: 'Barbell Kneeling Squat',
  equipment: ['barbell', 'mat'],
  sources: ['fe:Kneeling_Squat', 'hz:0102'],
}) satisfies import('@/exercise.ts').SideExercise;
