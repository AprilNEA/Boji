// V-handle bent-over machine row, side view. Hinge at the hips with soft knees and a flat back.
// Pull the close neutral V-handle toward the abdomen, then extend the arms without swinging.
// The machine lever follows the handle, while the trunk angle stays fixed.
import type { SideExercise } from '@/exercise.ts';
import { makeBentMachineRow } from './_horizontal-row-3.ts';

export default makeBentMachineRow({
  id: 'machine-v-bar-bent-over-row', name: '器械窄握俯身划船', en: 'Machine V-Bar Bent-Over Row',
  equipment: ['machine'], sources: ['hz:3200'],
}, { close: true }) satisfies SideExercise;
