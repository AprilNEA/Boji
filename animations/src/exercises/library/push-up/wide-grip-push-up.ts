// Begin in a high plank with a deliberately wide hand placement and a straight trunk.
// Bend the elbows to lower the chest near the mat, then press back to the locked-out plank.
import type { SideExercise } from '@/exercise.ts';
import { floorPush } from './_push-up-2.ts';

export default floorPush({
  id: 'wide-grip-push-up', name: '宽距俯卧撑', en: 'Wide-Grip Push-Up',
  equipment: ['bodyweight'], sources: ['fe:Push-Up_Wide', 'hz:1311'],
}) satisfies SideExercise;
