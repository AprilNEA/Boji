// Start face down on a Roman-chair pad with the ankles secured and the arms crossed over the chest.
// Hinge at the hips with a flat back, then return only to the straight line with the legs.
import type { SideExercise } from '@/exercise.ts';
import { romanBackExtension } from './_back-extension.ts';

export default romanBackExtension({
  id: 'back-extension', name: '罗马椅背部伸展',
  meta: { en: 'Back Extension', family: 'back-extension', equipment: ['bench'], sources: ['fe:Hyperextensions_Back_Extensions'] },
}) satisfies SideExercise;
