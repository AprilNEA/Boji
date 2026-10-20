// Rest the bar across the upper chest and front shoulders with the elbows forward.
// Lower with the chest up until the thighs reach parallel, then stand through the heels.
// The source for the front-box naming variant describes this same visible front squat.
import { makeFrontSquat } from './_squat-1.ts';

export default makeFrontSquat({
  id: 'barbell-front-squat',
  name: '杠铃前蹲',
  en: 'Barbell Front Squat',
  equipment: ['barbell'],
  sources: ['hz:0024', 'hz:0039', 'hz:0042'],
}, { grip: 'clean' }) satisfies import('@/exercise.ts').SideExercise;
