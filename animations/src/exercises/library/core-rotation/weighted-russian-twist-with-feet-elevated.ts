// Balance seated with knees bent and both feet lifted together off the floor.
// Hold the weight with softly bent elbows and twist it down toward each side.
// The feet stay elevated and the weight remains held securely in both hands.
import type { FrontExercise } from '@/exercise.ts';
import { heldPlate } from '@/exercises/equipment/index.ts';
import { meanGrip, pairedHands, seated } from './_core-rotation-2.ts';

const swing = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'weighted-russian-twist-with-feet-elevated', name: '负重抬腿俄罗斯转体', view: 'front', tl: { total: 3.2 },
  meta: { en: 'Weighted Russian Twist with Feet Elevated', family: 'core-rotation', equipment: ['other', 'plate'], sources: ['hz:0845'] },
  muscles: [{ m: 'abs', e: () => 0.9 }, { m: 'obliques', scale: 0.75, e: () => 0.82 }, { m: 'hipFlexor', scale: 0.45, e: () => 0.62 }],
  dynamic: [heldPlate((J) => ({ p: meanGrip(J) }), 'face', 'small')],
  poster: 0.25,
  pose(t) {
    const u = swing(t);
    return { ...seated(38 * u, true, true), arms: pairedHands([64 * u, 168, 68]) };
  },
} satisfies FrontExercise;
