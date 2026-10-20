// Lying face down on an elevated flat bench. A cambered bar hangs below the chest and rows upward.
// The chest stays on the pad and straight legs keep both feet on the floor.
import type { SideExercise } from '@/exercise.ts';
import { proneRow } from './_horizontal-row-1.ts';

export default proneRow({
  id: 'cambered-barbell-prone-row',
  name: '弯曲杠铃俯卧划船',
  meta: { en: 'Cambered Barbell Prone Row', family: 'horizontal-row', equipment: ['barbell', 'bench'], sources: ['fe:Lying_Cambered_Barbell_Row', 'hz:0248'] },
}) satisfies SideExercise;
