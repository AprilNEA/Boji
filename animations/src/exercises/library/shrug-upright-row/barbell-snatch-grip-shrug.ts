// Take a wide overhand grip with the bar hanging at the mid-thighs.
// Keep the elbows straight and elevate both shoulders, then lower the bar under control.
import type { FrontExercise } from '@/exercise.ts';
import { frontSnatchGripShrug } from './_shrug-upright-row.ts';

export default frontSnatchGripShrug({
  id: 'barbell-snatch-grip-shrug', name: '杠铃抓举握距耸肩', en: 'Barbell Snatch-Grip Shrug',
  sources: ['fe:Snatch_Shrug'],
}) satisfies FrontExercise;
