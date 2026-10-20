// Set the bar across the upper back and attach bands from both sleeves to floor anchors.
// Push the knees and hips out while sitting back to a parallel squat.
// The bands lengthen on the ascent while the heels remain planted.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-banded-back-squat',
  name: '杠铃弹力带背蹲',
  en: 'Barbell Banded Back Squat',
  equipment: ['barbell', 'band'],
  sources: ['fe:Squat_with_Bands'],
}, { banded: true, wide: true }) satisfies import('@/exercise.ts').SideExercise;
