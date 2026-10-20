// Hinge with a wide stance, knees soft, hips back, and a neutral flat back.
// Pass one kettlebell between and around the legs in a continuous figure-eight path.
// The feet stay planted while both hands meet near the handle during each controlled pass.
import type { FrontExercise } from '@/exercise.ts';
import { kettlebell } from '@/exercises/equipment/index.ts';
import { meanGrip, pairedHands, standing } from './_core-rotation-2.ts';

const cycle = (t: number) => Math.PI * 2 * t;
export default {
  id: 'kettlebell-figure-eight', name: '壶铃八字绕腿', view: 'front', tl: { total: 2.8 },
  meta: { en: 'Kettlebell Figure Eight', family: 'core-rotation', equipment: ['kettlebell'], sources: ['fe:Kettlebell_Figure_8', 'hz:0532'] },
  muscles: [{ m: 'abs', e: () => 0.78 }, { m: 'hamstrings', scale: 0.55, e: () => 0.62, region: { view: 'front', part: 'thigh', c: [0, 58], s: [14, 34] } }, { m: 'forearms', scale: 0.35, e: () => 0.5 }],
  dynamic: [kettlebell((J) => ({ p: meanGrip(J) }), 'face')],
  poster: 0.25,
  pose(t) {
    const q = cycle(t);
    const hand: [number, number, number] = [42 * Math.sin(q), 178 + 18 * Math.cos(2 * q), 35 + 24 * Math.cos(q)];
    return { ...standing(68, 158, 0, 26), arms: pairedHands(hand) };
  },
} satisfies FrontExercise;
