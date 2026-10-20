// Parallel-bar chest dip, side view. The hands remain on the bars and the torso leans about 30° forward.
// The elbows flex under control and extend back to support without swinging the crossed legs.
import type { SideExercise } from '@/exercise.ts';
import { suspendedDip } from './_dip.ts';

export default suspendedDip({
  id: 'parallel-bar-chest-dip', name: '双杠前倾臂屈伸', en: 'Parallel Bar Chest Dip', equipment: ['dip-station'],
  sources: ['fe:Dips_-_Chest_Version', 'hz:2363'],
}, 'chest') satisfies SideExercise;
