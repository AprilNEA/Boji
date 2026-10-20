// Rest the bar across the rear deltoids below the upper trapezius.
// Push the hips back with a braced forward torso lean and planted heels.
// Extend the knees and hips to return to the same low-bar position.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-low-bar-back-squat',
  name: '杠铃低杠背蹲',
  en: 'Barbell Low-Bar Back Squat',
  equipment: ['barbell'],
  sources: ['hz:1435'],
}, { bar: 'low' }) satisfies import('@/exercise.ts').SideExercise;
