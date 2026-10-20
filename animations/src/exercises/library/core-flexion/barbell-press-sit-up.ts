// Lie with bent knees and the barbell resting above the chest.
// Curl the torso to 45 degrees while the elbows extend to press the bar overhead, then lower both together.
import type { SideExercise } from '@/exercise.ts';
import { barbellSitUp } from './_core-flexion-1.ts';
export default barbellSitUp({ id: 'barbell-press-sit-up', name: '杠铃推举仰卧起坐', meta: { en: 'Barbell Press Sit-Up', family: 'core-flexion', equipment: ['barbell', 'mat'], sources: ['hz:0071'] }, muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.4 }, { m: 'pecs', scale: 0.3 }] }, { press: true }) satisfies SideExercise;
