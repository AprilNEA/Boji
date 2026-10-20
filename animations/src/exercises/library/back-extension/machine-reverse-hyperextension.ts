// Start prone on the reverse-hyper machine with the torso supported, hands on the handles and feet in the moving pads.
// Extend the hips to bring the straight legs near torso level, stopping before lumbar overextension.
import type { SideExercise } from '@/exercise.ts';
import { machineReverseHyper } from './_back-extension.ts';

export default machineReverseHyper({
  id: 'machine-reverse-hyperextension', name: '器械反向挺身',
  meta: { en: 'Machine Reverse Hyperextension', family: 'back-extension', equipment: ['machine'], sources: ['fe:Reverse_Hyperextension', 'hz:0593'] },
}) satisfies SideExercise;
