// Start on hands and knees with both knees under the hips and both hands under the shoulders.
// Alternate sides: keep the pelvis and supporting limbs still while the working thigh reaches straight back.
// At the top, the thigh is level and the bent calf points up; the knee remains at about 90 degrees.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import type { LimbSpec } from '@/rig.ts';
import { alternate, alternateTL, activeValue, quadBase, quadrupedArms, quadrupedLegs } from './_glute-kickback.ts';

const kickLeg = (p: number): LimbSpec => ({ a1: lerp(90, 180, p), a2: lerp(178, 270, p), foot: 180 });

export default {
  id: 'quadruped-bent-knee-glute-kickback',
  name: '跪姿屈膝后踢腿',
  tl: alternateTL,
  mat: true,
  meta: {
    en: 'Quadruped Bent-Knee Glute Kickback',
    family: 'glute-kickback',
    equipment: ['bodyweight', 'mat'],
    sources: ['fe:Glute_Kickback'],
  },
  muscles: [
    { m: 'glutes', side: 'near', e: (t) => activeValue(t, 'near') },
    { m: 'glutes', side: 'far', e: (t) => activeValue(t, 'far') },
    { m: 'hamstrings', side: 'near', scale: 0.45, e: (t) => activeValue(t, 'near') },
    { m: 'hamstrings', side: 'far', scale: 0.45, e: (t) => activeValue(t, 'far') },
  ],
  pose(t) {
    const { side, p } = alternate(t);
    return { ...quadBase, legs: quadrupedLegs(side, kickLeg(p)), arms: quadrupedArms };
  },
} satisfies SideExercise;
