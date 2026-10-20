// Start leaning into the sled with both arms extended on the handles.
// Drive the legs through rapid, short alternating sprint steps without losing the trunk line.
// The sled handles remain fixed under the straight arms as the feet cycle.
import type { SideExercise } from '@/exercise.ts';
import { sledPush } from './_carry-strongman.ts';

export default sledPush({
  id: 'sled-sprint-push', name: '雪橇冲刺推', en: 'Sled Sprint Push',
  equipment: ['sled'], sources: ['fe:Prowler_Sprint'],
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.75 }, { m: 'quads', side: 'both', scale: 0.6 }, { m: 'calves', side: 'both', scale: 0.45 }],
}, true) satisfies SideExercise;
