// Face the sled while holding the paired handles straight above the shoulders.
// Keep both elbows extended and walk backward with smooth, controlled steps.
// The ropes remain taut from the sled to the two overhead hands without jerking.
import type { SideExercise } from '@/exercise.ts';
import { overheadBackwardSledDrag } from './_carry-strongman.ts';

export default overheadBackwardSledDrag({
  id: 'sled-overhead-backward-walk', name: '雪橇过顶倒退拖行', en: 'Sled Overhead Backward Walk',
  equipment: ['sled', 'rope'], sources: ['fe:Sled_Overhead_Backward_Walk'],
  muscles: [{ m: 'delts', side: 'both' }, { m: 'quads', side: 'both', scale: 0.55 }, { m: 'traps', scale: 0.45 }, { m: 'triceps', side: 'both', scale: 0.4 }],
}) satisfies SideExercise;
