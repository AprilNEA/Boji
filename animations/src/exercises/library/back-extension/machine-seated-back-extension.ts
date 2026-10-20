// Start seated with the feet secured, hands on the handles and the torso gently flexed against the movable back pad.
// Extend to an upright neutral trunk without arching past the seat, then return through the same range.
import type { SideExercise } from '@/exercise.ts';
import { seatedBackExtension } from './_back-extension.ts';

export default seatedBackExtension({
  id: 'machine-seated-back-extension', name: '器械坐姿背部伸展',
  meta: { en: 'Machine Seated Back Extension', family: 'back-extension', equipment: ['machine'], sources: ['hz:0573'] },
}) satisfies SideExercise;
