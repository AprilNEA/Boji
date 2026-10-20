// Start in an athletic forward lean with both hands on the sled handles.
// Keep the arms fully extended while the hips and knees drive the sled forward.
// Both feet push in short controlled steps and the back remains straight.
import type { SideExercise } from '@/exercise.ts';
import { sledPush } from './_carry-strongman.ts';

export default sledPush({
  id: 'sled-push', name: '推雪橇', en: 'Sled Push',
  equipment: ['sled'], sources: ['fe:Sled_Push'],
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.55 }, { m: 'triceps', side: 'both', scale: 0.4 }],
}, false) satisfies SideExercise;
