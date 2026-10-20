// Suspension row, side view. Lean back from chest-height handles with a rigid body and grounded heels.
// Pull the chest toward the handles by flexing the elbows and retracting the shoulder blades.
// The handles and straps stay fixed to the anchor while the body travels toward them.
import type { SideExercise } from '@/exercise.ts';
import { makeSuspensionRow } from './_horizontal-row-3.ts';

export default makeSuspensionRow({
  id: 'suspension-row', name: '悬吊划船', en: 'Suspension Row',
  equipment: ['suspension', 'bodyweight'], sources: ['fe:Suspended_Row'],
}) satisfies SideExercise;
