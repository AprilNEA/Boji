// Rest the bar high on the upper trapezius with a shoulder-width stance.
// Lower under control with the chest lifted and heels planted.
// Stand by extending the hips and knees together.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-high-bar-back-squat',
  name: '杠铃高杠背蹲',
  en: 'Barbell High-Bar Back Squat',
  equipment: ['barbell'],
  sources: ['hz:1436'],
}, { bar: 'high' }) satisfies import('@/exercise.ts').SideExercise;
