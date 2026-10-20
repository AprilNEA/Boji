// Sit with both knees bent and feet flat while holding a compact plate close to the chest.
// Lean back slightly and rotate the torso to carry the weight toward each side of the body.
// The feet stay grounded and the load remains between both hands throughout the twist.
import type { FrontExercise } from '@/exercise.ts';
import { heldPlate } from '@/exercises/equipment/index.ts';
import { meanGrip, pairedHands, seated } from './_core-rotation-2.ts';

const swing = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'weighted-russian-twist', name: '负重俄罗斯转体', view: 'front', tl: { total: 3.2 },
  meta: { en: 'Weighted Russian Twist', family: 'core-rotation', equipment: ['other', 'plate'], sources: ['hz:0846', 'hz:2371'] },
  muscles: [{ m: 'abs', e: () => 0.88 }, { m: 'obliques', scale: 0.8, e: () => 0.82 }],
  dynamic: [heldPlate((J) => ({ p: meanGrip(J) }), 'face', 'small')],
  poster: 0.25,
  pose(t) {
    const u = swing(t);
    return { ...seated(36 * u), arms: pairedHands([63 * u, 174, 68]) };
  },
} satisfies FrontExercise;
