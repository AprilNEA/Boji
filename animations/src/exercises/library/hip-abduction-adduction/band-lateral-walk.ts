// Start in a shallow squat with an ankle band taut between shoulder-width feet.
// The lead foot steps laterally first. The trailing foot follows while the hips stay low and square.
// Both feet return to the start for a seamless demonstration loop.
import type { FrontExercise } from '@/exercise.ts';
import { clamp, smooth } from '@/math.ts';
import { project } from '@/front-rig.ts';
import { bandCurve, miniBandPoints } from '@/exercises/equipment/index.ts';
import { standingPose } from './_hip-abduction-adduction.ts';

const phase = (t: number): number => Math.sin(Math.PI * t);
const follow = (p: number): number => smooth(clamp((p - 0.32) / 0.68, 0, 1));

export default {
  id: 'band-lateral-walk',
  name: '弹力带侧向行走',
  view: 'front',
  tl: { total: 3.6 },
  meta: { en: 'Band Lateral Walk', family: 'hip-abduction-adduction', equipment: ['band'], sources: ['hz:0628'] },
  muscles: [
    { m: 'abductors', side: 'r', e: (t) => 0.35 + 0.65 * phase(t) },
    { m: 'glutes', scale: 0.7, e: (t) => 0.25 + 0.55 * phase(t), region: { view: 'front', part: 'pelvis', c: [0, 12], s: [34, 18] } },
    { m: 'quads', side: 'both', scale: 0.35, e: () => 0.35 },
  ],
  dynamic: [bandCurve((J) => miniBandPoints(project(J.ankle_r), project(J.ankle_l), 5), 'front', 'Ankle Band')],
  // Mid-stride makes the side-step readable in the still poster.
  poster: 0.25,
  pose(t) {
    const p = phase(t), f = follow(p);
    const shift = -39 * f;
    return standingPose({
      // The figure's right leg is the lead leg on the screen-left side.
      l: { target: [28 - 39 * f, 13, 5] },
      r: { target: [-28 - 45 * p, 13, 5] },
    }, [shift, 193, 0]);
  },
} satisfies FrontExercise;
