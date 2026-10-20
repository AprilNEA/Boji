// Attach bands from the bar sleeves to stable floor anchors and place a box behind the hips.
// Sit back to the box without bouncing, then drive through the heels.
// The back stays braced and the band tension rises at the top.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-banded-box-squat',
  name: '杠铃弹力带箱式深蹲',
  en: 'Barbell Banded Box Squat',
  equipment: ['barbell', 'band', 'box'],
  sources: ['fe:Box_Squat_with_Bands'],
}, { banded: true, bench: 'box', wide: true }) satisfies import('@/exercise.ts').SideExercise;
