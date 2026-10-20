// Stand tall with feet under the hips and squeeze a stack of lightweight plates between both palms at chest height.
// Keep the inward squeeze while pressing the plates forward, then return them to the chest.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'weight-plate-svend-press',
  name: '杠铃片斯文推胸',
  en: 'Weight Plate Svend Press',
  equipment: ['plate'],
  sources: ['fe:Svend_Press', 'hz:0856'],
  kind: 'svend-press',
}) satisfies SideExercise;
