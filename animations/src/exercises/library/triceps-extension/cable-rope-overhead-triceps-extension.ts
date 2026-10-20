// Stand facing away from a low pulley with the rope behind the head.
// Keep both upper arms vertical and straighten the elbows without moving the torso.
import type { SideExercise } from '@/exercise.ts';
import { cableOverheadExtension } from './_triceps-extension-2.ts';

export default cableOverheadExtension({
  id: 'cable-rope-overhead-triceps-extension', name: '绳索绳把过顶臂屈伸', rope: true,
  meta: { en: 'Cable Rope Overhead Triceps Extension', family: 'triceps-extension', equipment: ['cable'], sources: ['fe:Cable_Rope_Overhead_Triceps_Extension', 'fe:Triceps_Overhead_Extension_with_Rope'] },
}) satisfies SideExercise;
