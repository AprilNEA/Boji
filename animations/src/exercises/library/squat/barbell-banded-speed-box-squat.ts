// Use bands anchored near the floor with a box behind the hips.
// Descend under control to the box, pause briefly, then stand explosively.
// The feet stay flat and the bar remains across the upper back.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-banded-speed-box-squat',
  name: '杠铃弹力带速度箱式深蹲',
  en: 'Barbell Banded Speed Box Squat',
  equipment: ['barbell', 'band', 'box'],
  sources: ['fe:Speed_Box_Squat'],
}, { banded: true, bench: 'box', speed: true }) satisfies import('@/exercise.ts').SideExercise;
