// Lie on one side with stacked straight legs and the lower arm under the head.
// The upper straight leg lifts about 38° without rolling the pelvis, then lowers with control.
// The bottom leg and the head-supporting arm stay fixed on the mat.
import type { SideExercise } from '@/exercise.ts';
import { add, ang, dir, lerp, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { FLOOR } from '@/exercises/common.ts';
import { workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.4);
const neck: Vec2 = [160, FLOOR - 18];
const hip = add(neck, mul(dir(-3.8), 123.7));
const flat = ang(sub(neck, hip));

export default {
  id: 'side-lying-straight-leg-hip-abduction',
  name: '侧卧直腿髋外展',
  tl,
  mat: true,
  meta: {
    en: 'Side-Lying Straight-Leg Hip Abduction', family: 'hip-abduction-adduction', equipment: ['bodyweight', 'mat'],
    sources: ['hz:1427', 'hz:3667'],
  },
  muscles: [{ m: 'abductors', side: 'near' }, { m: 'glutes', scale: 0.55 }, { m: 'hamstrings', side: 'near', scale: 0.3 }],
  pose(t) {
    const a = lerp(0, -38, tl.at(t).p);
    return {
      hip, spine: { lumbar: flat - 1, thoracic: flat + 1 }, neck: 182, head: 181,
      // The near leg is the visible top leg. Equal segment angles keep the knee fully extended.
      legs: { near: { a1: a, a2: a, foot: 0 }, far: { a1: 1, a2: 1, foot: 0 } },
      arms: {
        // The upper arm rests along the body; it must not drop below the mat.
        near: { a1: 0, a2: 0, hand: 0 },
        far: { a1: 179, a2: 179, hand: 180 },
      },
    };
  },
} satisfies SideExercise;
