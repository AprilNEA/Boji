// Stand tall with a stable parallel stance and take the machine handles at chest height.
// The handles press forward through elbow extension while the torso and planted feet remain still.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'machine-standing-chest-press',
  name: '器械站姿推胸',
  en: 'Machine Standing Chest Press',
  equipment: ['machine'],
  sources: ['hz:3758'],
  kind: 'machine-standing',
}) satisfies SideExercise;
