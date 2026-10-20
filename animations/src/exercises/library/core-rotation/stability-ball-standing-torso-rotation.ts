// Stand upright with both hands holding a stability ball at arm's length in front of the chest.
// Rotate the torso to each side while following the ball with the eyes and keeping the arms long.
// The stance remains upright and both soles remain flat on the ground.
import type { FrontExercise } from '@/exercise.ts';
import { stabilityBall } from '@/exercises/equipment/index.ts';
import { meanGrip, pairedHands, standing } from './_core-rotation-2.ts';

const turn = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'stability-ball-standing-torso-rotation', name: '健身球站姿转体', view: 'front', tl: { total: 3.2 },
  meta: { en: 'Stability Ball Standing Torso Rotation', family: 'core-rotation', equipment: ['stability-ball'], sources: ['fe:Torso_Rotation'] },
  muscles: [{ m: 'abs', e: () => 0.85 }, { m: 'obliques', scale: 0.7, e: () => 0.78 }],
  dynamic: [stabilityBall((J) => ({ p: meanGrip(J) }), 'front', 92)],
  poster: 0.25,
  pose(t) {
    const u = turn(t);
    return { ...standing(38, 195, 42 * u), arms: pairedHands([58 * u, 282, 84]) };
  },
} satisfies FrontExercise;
