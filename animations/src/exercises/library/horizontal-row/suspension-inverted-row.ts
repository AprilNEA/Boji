// Suspension inverted row, side view. Keep the body straight from the heels through the head below the handles.
// Flex the elbows to raise the chest toward the fixed handles, then lower under control.
// The heels remain on the floor and the straps stay anchored at the top beam.
import type { SideExercise } from '@/exercise.ts';
import { makeSuspensionRow } from './_horizontal-row-3.ts';

export default makeSuspensionRow({
  id: 'suspension-inverted-row', name: '悬吊反向划船', en: 'Suspension Inverted Row',
  equipment: ['suspension', 'bodyweight'], sources: ['fe:Inverted_Row_with_Straps', 'hz:0498'],
}, { low: true }) satisfies SideExercise;
