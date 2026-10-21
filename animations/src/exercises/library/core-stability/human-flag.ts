// Grip a vertical pole with the hands at different heights and begin in a straight hang.
// Lift the straight body sideways until the torso and legs form one horizontal line.
// Both hands stay fixed to the pole throughout the controlled raise and lower.
import type { SideExercise } from '@/exercise.ts';
import { timeline } from '@/math/timeline.ts';
import { humanFlagPose } from './_core-stability-1.ts';

const tl = timeline([
  { d: 1.5, from: 0, to: 1, e: [0.5, 1] }, { d: 1.2, from: 1, to: 1, e: [1, 0.92] },
  { d: 1.5, from: 1, to: 0, e: [0.92, 0.5] }, { d: 0.4, from: 0, to: 0, e: [0.45, 0.45] },
]);

export default {
  id: 'human-flag',
  name: '人体旗帜',
  tl,
  meta: { en: 'Human Flag', family: 'core-stability', equipment: ['other'], sources: ['hz:3303'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.72 }, { m: 'delts', side: 'both', scale: 0.52 }],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'flag-pole', color: pal.metalDark, c: [270, 252], s: [16, 404], r: 7 },
    { kind: 'box', nm: 'flag-pole-base', color: pal.metal, c: [270, 450], s: [86, 8], r: 4 },
  ] }),
  propsBox: [226, 425],
  poster: 0.42,
  pose: (t) => humanFlagPose(tl.at(t).p),
} satisfies SideExercise;
