// 徒手深蹲 (bodyweight-squat). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '../exercise.ts';
import { lerp, smooth, timeline, type Vec2 } from '../math.ts';
import { A, G, standLegs } from './common.ts';

const squatTL = timeline([
  { d: 1.5, from: 0, to: 1, e: [0.15, 0.5] },
  { d: 0.25, from: 1, to: 1, e: [0.5, 0.75] },
  { d: 1.15, from: 1, to: 0, e: [1, 0.85] },
  { d: 0.6, from: 0, to: 0, e: [0.85, 0.15] },
]);
const bodyweightSquat = {
  id: 'bodyweight-squat', name: '徒手深蹲', tl: squatTL,
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes' }],
  pose(t) {
    const { p } = squatTL.at(t);
    const x0 = 280;
    const px = Math.sin((p * Math.PI) / 2); // hips travel back first
    const py = 1 - Math.cos((p * Math.PI) / 2);
    const hip: Vec2 = [lerp(x0 - 8, x0 - 80, px), lerp(G - A - 180, G - A - 104, py)];
    const pa = smooth(Math.min(1, p * 1.25));
    return {
      hip,
      spine: { lumbar: lerp(-88, -47, p), thoracic: lerp(-91, -53, p) },
      neck: lerp(-84, -60, p), head: lerp(-88, -74, p),
      legs: standLegs(x0),
      arms: {
        near: { a1: lerp(93, -2, pa), a2: lerp(86, -4, pa), hand: lerp(88, -4, pa) },
        far: { a1: lerp(95, 1, pa), a2: lerp(88, -1, pa), hand: lerp(90, -1, pa) },
      },
    };
  },
} satisfies Exercise;

export default bodyweightSquat;
