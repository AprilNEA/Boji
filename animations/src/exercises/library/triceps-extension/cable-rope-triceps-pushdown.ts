// Stand at a high pulley with elbows close to the sides and a neutral rope grip.
// Keep upper arms still while pressing the rope down alongside the thighs.
import type { SideExercise } from '@/exercise.ts';
import { cablePushdown } from './_triceps-extension-2.ts';

export default cablePushdown({
  id: 'cable-rope-triceps-pushdown', name: '绳索绳把下压', attachment: 'rope',
  meta: { en: 'Cable Rope Triceps Pushdown', family: 'triceps-extension', equipment: ['cable'], sources: ['fe:Triceps_Pushdown_-_Rope_Attachment', 'hz:0200'] },
}) satisfies SideExercise;
