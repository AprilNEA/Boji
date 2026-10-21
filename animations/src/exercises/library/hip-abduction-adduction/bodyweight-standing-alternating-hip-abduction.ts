// Stand tall with both hands on the hips and shift weight onto one stable leg.
// Lift the opposite straight leg sideways about 40°, return, then repeat on the other side.
// The pelvis stays level and the support foot remains flat throughout the alternating loop.
import type { FrontExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { standingPose } from './_hip-abduction-adduction.ts';

const tl = timeline([
  { d: 0.9, from: 0, to: 1, e: [0.3, 1] }, { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.0, from: 1, to: 0, e: [0.85, 0.4] }, { d: 0.9, from: 0, to: -1, e: [0.3, 1] },
  { d: 0.35, from: -1, to: -1, e: [1, 0.9] }, { d: 1.0, from: -1, to: 0, e: [0.85, 0.4] },
]);

export default {
  id: 'bodyweight-standing-alternating-hip-abduction',
  name: '站姿交替髋外展',
  view: 'front',
  tl,
  meta: { en: 'Bodyweight Standing Alternating Hip Abduction', family: 'hip-abduction-adduction', equipment: ['bodyweight'], sources: ['hz:0710'] },
  muscles: [{ m: 'abductors', side: 'both' }, { m: 'glutes', scale: 0.6, region: { view: 'front', part: 'pelvis', c: [0, 12], s: [34, 18] } }, { m: 'quads', side: 'both', scale: 0.3 }],
  pose(t) {
    const q = tl.at(t).p;
    const l = Math.max(0, q), r = Math.max(0, -q);
    return standingPose({
      // The hip-to-ankle reach stays near 184 px, so each raised knee remains straight.
      l: { target: [lerp(27, 135, l), lerp(13, 56, l), 5] },
      r: { target: [lerp(-27, -135, r), lerp(13, 56, r), 5] },
    });
  },
} satisfies FrontExercise;
