// Start in a wide stance with both hands holding one kettlebell at waist level.
// Turn the trunk and swing the long arms to head height on one side, then the other.
// Both feet remain wide and grounded while the kettlebell follows the two-hand grip.
import type { FrontExercise } from '@/exercise.ts';
import { kettlebell } from '@/exercises/equipment/index.ts';
import { meanGrip, pairedHands, standing } from './_core-rotation-2.ts';

const wave = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'kettlebell-pirate-ship-swing', name: '壶铃海盗船摆动', view: 'front', tl: { total: 3.0 },
  meta: { en: 'Kettlebell Pirate Ship Swing', family: 'core-rotation', equipment: ['kettlebell'], sources: ['fe:Kettlebell_Pirate_Ships'] },
  muscles: [{ m: 'delts', e: () => 0.85 }, { m: 'abs', scale: 0.55, e: () => 0.62 }, { m: 'obliques', scale: 0.45, e: () => 0.55 }],
  dynamic: [kettlebell((J) => ({ p: meanGrip(J) }), 'face')],
  poster: 0.25,
  pose(t) {
    const u = wave(t), h = Math.abs(u);
    const hand: [number, number, number] = [60 * u, 238 + 105 * h, 90];
    return { ...standing(58, 188, 38 * u), arms: pairedHands(hand) };
  },
} satisfies FrontExercise;
