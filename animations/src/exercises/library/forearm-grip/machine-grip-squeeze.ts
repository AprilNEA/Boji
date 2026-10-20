// Sit upright in the leverage grip machine with both feet flat and both wrists neutral on the handles.
// Squeeze the handles together with the fingers, hold briefly, and release without moving the back or elbows.
import type { SideExercise } from '@/exercise.ts';
import { machineGripSqueeze } from './_forearm-grip-2.ts';

export default machineGripSqueeze({
  id: 'machine-grip-squeeze', name: '器械握力训练', en: 'Machine Grip Squeeze', sources: ['hz:2288'],
}) satisfies SideExercise;
