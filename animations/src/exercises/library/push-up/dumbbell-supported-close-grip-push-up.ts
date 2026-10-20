// Begin in a high plank with both hands stacked on one upright dumbbell below the chest.
// Keep the elbows tight as the chest descends, then extend the arms without changing the trunk line.
import type { SideExercise } from '@/exercise.ts';
import { floorPush, tricepsMuscles } from './_push-up-2.ts';

export default floorPush({
  id: 'dumbbell-supported-close-grip-push-up', name: '哑铃支撑窄距俯卧撑', en: 'Dumbbell-Supported Close-Grip Push-Up',
  equipment: ['bodyweight', 'dumbbell'], sources: ['fe:Close-Grip_Push-Up_off_of_a_Dumbbell'], muscles: tricepsMuscles(),
  props: (pal) => ({ front: [
    { kind: 'box', nm: 'upright-dumbbell-handle', color: pal.metal, c: [399, 424], s: [8, 29], r: 4 },
    { kind: 'oval', nm: 'upright-dumbbell-plate-a', color: pal.plate, c: [399, 413], s: [28, 10] },
    { kind: 'oval', nm: 'upright-dumbbell-plate-b', color: pal.plate, c: [399, 435], s: [28, 10] },
  ] }), propsBox: [381, 417],
}) satisfies SideExercise;
