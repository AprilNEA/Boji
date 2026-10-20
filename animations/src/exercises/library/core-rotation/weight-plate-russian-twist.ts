// Balance seated with the legs raised and crossed, holding a plate slightly in front of the abdominals.
// Lean the upper body back and touch the plate toward each side in a controlled rotation.
// The plate follows both hands while the raised legs remain together.
import type { FrontExercise } from '@/exercise.ts';
import { heldPlate } from '@/exercises/equipment/index.ts';
import { meanGrip, pairedHands, seated } from './_core-rotation-2.ts';

const swing = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'weight-plate-russian-twist', name: '杠铃片俄罗斯转体', view: 'front', tl: { total: 3.3 },
  meta: { en: 'Weight Plate Russian Twist', family: 'core-rotation', equipment: ['other', 'plate'], sources: ['fe:Plate_Twist'] },
  muscles: [{ m: 'abs', e: () => 0.88 }, { m: 'obliques', scale: 0.8, e: () => 0.82 }],
  dynamic: [heldPlate((J) => ({ p: meanGrip(J) }), 'face', 'medium')],
  poster: 0.25,
  pose(t) {
    const u = swing(t);
    return { ...seated(38 * u, true, true), arms: pairedHands([64 * u, 164, 65]) };
  },
} satisfies FrontExercise;
