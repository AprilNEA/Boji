// Rest the bar across the front deltoids and support it with the fingertips in a clean grip.
// Keep the elbows high as the hips and knees flex into a deep upright squat.
// Drive through the heels while the bar remains on the shoulder shelf.
import { makeFrontSquat } from './_squat-1.ts';

export default makeFrontSquat({
  id: 'barbell-clean-grip-front-squat',
  name: '杠铃翻腕前蹲',
  en: 'Barbell Clean-Grip Front Squat',
  equipment: ['barbell'],
  sources: ['fe:Front_Squat_Clean_Grip', 'hz:0029'],
}, { grip: 'clean', deep: true }) satisfies import('@/exercise.ts').SideExercise;
