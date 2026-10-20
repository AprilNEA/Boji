// Start supine with both legs long and the lumbar spine resting on the mat.
// Both knees draw toward the chest as the arms wrap around the shins; the back stays down.
import type { SideExercise } from '@/exercise.ts';
import { kneesToChest, libraryMeta, lowerStretch } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'knees-to-chest-stretch', name: '仰卧抱膝拉伸',
  meta: libraryMeta('Knees-to-Chest Stretch', ['bodyweight'], ['hz:1418']),
  muscles: [{ m: 'glutes', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
  pose: kneesToChest,
}) satisfies SideExercise;
