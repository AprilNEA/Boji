// Set a box behind the hips and hold the bar tightly across the upper back.
// Sit back to the box under control, pause without bouncing, and stand through the heels.
// The torso stays braced and both feet remain flat.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-box-squat',
  name: '杠铃箱式深蹲',
  en: 'Barbell Box Squat',
  equipment: ['barbell', 'box'],
  sources: ['fe:Box_Squat', 'hz:0026'],
}, { bench: 'box', wide: true }) satisfies import('@/exercise.ts').SideExercise;
