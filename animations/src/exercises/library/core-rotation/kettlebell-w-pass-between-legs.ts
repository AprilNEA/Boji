// Hinge with the hips back, a flat back, and feet set comfortably apart around one kettlebell.
// Pass the bell between the legs from one side to the other in a repeated W-shaped handoff path.
// The feet stay flat and the handle remains under control near the receiving hand.
import type { FrontExercise } from '@/exercise.ts';
import { kettlebell } from '@/exercises/equipment/index.ts';
import { meanGrip, pairedHands, standing } from './_core-rotation-2.ts';

const cycle = (t: number) => Math.PI * 2 * t;
export default {
  id: 'kettlebell-w-pass-between-legs', name: '壶铃胯下交替传递', view: 'front', tl: { total: 2.8 },
  meta: { en: 'Kettlebell W Pass Between Legs', family: 'core-rotation', equipment: ['kettlebell'], sources: ['fe:Kettlebell_Pass_Between_The_Legs'] },
  muscles: [{ m: 'abs', e: () => 0.78 }, { m: 'glutes', scale: 0.5, e: () => 0.55, region: { view: 'front', part: 'pelvis', c: [0, 6], s: [22, 13] } }, { m: 'hamstrings', scale: 0.45, e: () => 0.55, region: { view: 'front', part: 'thigh', c: [0, 58], s: [14, 34] } }, { m: 'forearms', scale: 0.3, e: () => 0.48 }],
  dynamic: [kettlebell((J) => ({ p: meanGrip(J) }), 'face')],
  poster: 0.25,
  pose(t) {
    const q = cycle(t);
    const hand: [number, number, number] = [52 * Math.sin(q), 164 + 38 * Math.abs(Math.sin(q)), 34 + 20 * Math.cos(q)];
    return { ...standing(62, 158, 0, 26), arms: pairedHands(hand) };
  },
} satisfies FrontExercise;
