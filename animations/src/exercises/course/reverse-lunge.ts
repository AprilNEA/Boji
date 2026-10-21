// 后撤步弓步蹲 (reverse-lunge). One rep per leg: the far leg steps back first, then the near leg. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { bump, smooth, timeline } from '@/math/timeline.ts';
import { clamp, lerp, lerpV, type Vec2 } from '@/math/vec2.ts';
import type { LimbSpec } from '@/rig/side.ts';
import { A, G, handOnHip, toesDown } from '@/exercises/common.ts';

const repTL = timeline([
  { d: 1.3, from: 0, to: 1, e: [0.15, 0.7] },
  { d: 0.25, from: 1, to: 1, e: [0.7, 0.85] },
  { d: 1.1, from: 1, to: 0, e: [1, 0.35] },
  { d: 0.5, from: 0, to: 0, e: [0.3, 0.15] },
]);
const lungeTL = { total: repTL.total * 2 };
const lungePhase = (t: number) => {
  const r = repTL.at((t % 0.5) * 2);
  return { rep: t < 0.5 ? 0 : 1, p: r.p, e: r.e };
};

const X0 = 280; // near ankle when standing
const STRIDE = 178; // front ankle to back ankle at the bottom
const HEEL_UP = 30; // back ankle height at the bottom

const reverseLunge = {
  id: 'reverse-lunge', name: '后撤步弓步蹲', tl: lungeTL,
  muscles: [
    { m: 'quads', side: 'near', e: (t: number) => (lungePhase(t).rep === 0 ? lungePhase(t).e : 0.15 * lungePhase(t).e) },
    { m: 'quads', side: 'far', e: (t: number) => (lungePhase(t).rep === 1 ? lungePhase(t).e : 0.15 * lungePhase(t).e) },
    { m: 'glutes', e: (t: number) => lungePhase(t).e },
  ],
  pose(t) {
    const { rep, p } = lungePhase(t);
    const frontX = rep === 0 ? X0 : X0 - 6;
    const backStart = rep === 0 ? X0 - 6 : X0;
    // Hips travel back and down together with the step.
    const hip = lerpV([X0 - 8, G - A - 181], [frontX - 84, G - 118], p);
    // The back foot swings back in the first 65% of the descent and lands on its toes.
    const u = smooth(clamp(p / 0.65, 0, 1));
    const h = lerp(A, HEEL_UP, smooth(clamp((p - 0.35) / 0.45, 0, 1)));
    const backAnkle: Vec2 = [lerp(backStart, frontX - STRIDE, u), G - h - 16 * bump(u)];
    const front: LimbSpec = { target: [frontX, G - A], foot: 0, side: [1, 0] };
    const back: LimbSpec = { target: backAnkle, foot: toesDown(h), side: [1, 0] };
    return {
      hip,
      spine: { lumbar: lerp(-89, -83, p), thoracic: lerp(-91, -86, p) },
      neck: lerp(-86, -84, p), head: -88,
      legs: rep === 0 ? { near: front, far: back } : { near: back, far: front },
      arms: { near: handOnHip(0), far: handOnHip(-4) },
    };
  },
} satisfies Exercise;

export default reverseLunge;
