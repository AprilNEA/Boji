// Sit with bent knees and flat feet, holding a medicine ball in front of the chest.
// Lean back slightly with a straight back and rotate the torso and ball to alternate sides.
// The hips and feet stay grounded while both hands remain on the ball.
import type { FrontExercise } from '@/exercise.ts';
import { medicineBall } from '@/exercises/equipment/index.ts';
import { meanGrip, pairedHands, seated } from './_core-rotation-2.ts';

const swing = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'medicine-ball-russian-twist', name: '药球俄罗斯转体', view: 'front', tl: { total: 3.2 },
  meta: { en: 'Medicine Ball Russian Twist', family: 'core-rotation', equipment: ['medicine-ball'], sources: ['hz:0014'] },
  muscles: [{ m: 'abs', e: () => 0.85 }, { m: 'obliques', scale: 0.75, e: () => 0.8 }],
  dynamic: [medicineBall((J) => ({ p: meanGrip(J) }), 'front', 50)],
  poster: 0.25,
  pose(t) {
    const u = swing(t);
    return { ...seated(36 * u), arms: pairedHands([58 * u, 178, 68]) };
  },
} satisfies FrontExercise;
