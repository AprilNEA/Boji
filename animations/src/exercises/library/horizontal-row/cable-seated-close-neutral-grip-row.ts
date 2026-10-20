// Sit upright at a low pulley with the feet firm against the front platform.
// The close V handle travels from a full reach to the abdomen while the torso remains stable.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-seated-close-neutral-grip-row', name: '坐姿窄距对握划船', en: 'Cable Seated Close Neutral-Grip Row',
  equipment: ['cable'], sources: ['fe:Seated_Cable_Rows'], handle: 'v',
}) satisfies SideExercise;
