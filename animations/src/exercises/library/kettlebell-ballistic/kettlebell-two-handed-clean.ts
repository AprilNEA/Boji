// Start hinged with both hands sharing one kettlebell handle.
// Drive through the hips and guide the bell into the rack. Both hands stay on the handle.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_kettlebell-ballistic.ts';

export default clean({ id: 'kettlebell-two-handed-clean', name: '壶铃双手翻铃', en: 'Kettlebell Two-Handed Clean', sources: ['hz:0552'] }, 'two-hands') satisfies SideExercise;
