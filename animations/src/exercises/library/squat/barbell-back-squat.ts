// Rest the loaded bar across the upper back with a shoulder-width, planted stance.
// Sit the hips back and down until the thighs are just below parallel.
// Drive through the heels to return to a tall standing position.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-back-squat',
  name: '杠铃背蹲',
  en: 'Barbell Back Squat',
  equipment: ['barbell'],
  sources: ['fe:Barbell_Squat'],
}) satisfies import('@/exercise.ts').SideExercise;
