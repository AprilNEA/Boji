// Three-point sprint start, side view. One hand is on the line, the feet are staggered and the hips sit above the head.
// The knees stay near a right angle, the torso is almost horizontal and the free arm points behind at shoulder height.
// A small preload lowers the hips without changing the fixed feet or grounded hand.
import type { SideExercise } from '@/exercise.ts';
import { lerp, timeline } from '@/math.ts';
import { G } from '@/exercises/common.ts';

const tl = timeline([
  { d: 0.5, from: 0, to: 1, e: [0.6, 1] },
  { d: 0.25, from: 1, to: 1, e: [1, 1] },
  { d: 0.7, from: 1, to: 0, e: [0.9, 0.6] },
]);

export default {
  id: 'three-point-sprint-start',
  name: '三点式短跑起跑',
  tl,
  poster: 0.45,
  meta: { en: 'Three-Point Sprint Start', family: 'cardio', equipment: ['bodyweight'], sources: ['fe:Linear_3-Part_Start_Technique'] },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'quads', side: 'both', scale: 0.6 }, { m: 'calves', side: 'both', scale: 0.45 }],
  pose(t) {
    const p = tl.at(t).p;
    return {
      // The nose approaches the lead knee while the head remains just below the loaded hip.
      hip: [lerp(220, 226, p), lerp(314, 307, p)], spine: { lumbar: lerp(4, 7, p), thoracic: lerp(5, 8, p) },
      neck: lerp(5, 8, p), head: lerp(5, 8, p), farHip: 0,
      // Front foot is loaded on the line. The rear toe is short and behind it.
      legs: {
        near: { target: [284, G - 41], side: [1, 0], foot: 85 },
        far: { target: [190, G - 41], side: [1, 0], foot: 85 },
      },
      arms: {
        near: { target: [320, G - 7], side: [-1, 0], hand: 0 },
        far: { target: (J) => [J.Sf[0] - 100, J.Sf[1] - 4], side: [-1, 0], hand: 180 },
      },
    };
  },
} satisfies SideExercise;
