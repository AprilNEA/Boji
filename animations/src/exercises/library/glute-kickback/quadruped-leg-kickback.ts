// Start on hands and knees with a 90-degree knee bend, neutral hips, and hands below the shoulders.
// Alternate sides: extend the working hip to about 165 degrees and the knee to 180 degrees behind the body.
// The supporting knee and both hands remain planted, so the low back does not arch to create range.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import type { LimbSpec } from '@/rig/side.ts';
import { alternate, alternateTL, activeValue, quadBase, quadrupedArms, quadrupedLegs } from './_glute-kickback.ts';

const kickLeg = (p: number): LimbSpec => ({ a1: lerp(90, 180, p), a2: lerp(178, 180, p), foot: lerp(180, 90, p) });

export default {
  id: 'quadruped-leg-kickback',
  name: '跪姿直腿后踢',
  tl: alternateTL,
  mat: true,
  meta: {
    en: 'Quadruped Leg Kickback',
    family: 'glute-kickback',
    equipment: ['bodyweight', 'mat'],
    sources: ['fe:Rear_Leg_Raises'],
  },
  muscles: [
    { m: 'glutes', side: 'near', e: (t) => activeValue(t, 'near') },
    { m: 'glutes', side: 'far', e: (t) => activeValue(t, 'far') },
    { m: 'hamstrings', side: 'near', scale: 0.35, e: (t) => activeValue(t, 'near') },
    { m: 'hamstrings', side: 'far', scale: 0.35, e: (t) => activeValue(t, 'far') },
  ],
  pose(t) {
    const { side, p } = alternate(t);
    return { ...quadBase, legs: quadrupedLegs(side, kickLeg(p)), arms: quadrupedArms };
  },
} satisfies SideExercise;
