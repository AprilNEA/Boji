// Support the body between parallel bars with straight arms and the hands fixed on the grips.
// Keep both legs together and raise them toward one side, then lower under control.
// The shoulders stay depressed and the legs remain long throughout the raise.
import type { FrontExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { BODY, GROUND } from '@/rig/side.ts';
import { dipBars, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.35);
const BAR_Y = GROUND - 195;
const bars = dipBars({ view: 'front', y: BAR_Y, gap: 96 });

export default {
  id: 'dip-station-side-leg-raise', name: '双杠侧举腿', view: 'front', tl,
  meta: { en: 'Dip Station Side Leg Raise', family: 'core-lateral', equipment: ['bodyweight', 'dip-station'], sources: ['hz:0709'] },
  muscles: [{ m: 'obliques' }, { m: 'abs', scale: 0.7 }, { m: 'hipFlexor', scale: 0.55 }],
  props: (pal) => ({ back: bars.draw(pal) }), propsBox: bars.box,
  pose(t) {
    const p = tl.at(t).p;
    const ankleY = lerp(29, 205, p);
    const ankleX = lerp(17, 200, p);
    const farAnkleY = lerp(29, 205, p);
    const farAnkleX = lerp(-17, 166, p);
    return {
      pelvis: [0, 212, 0],
      legs: {
        l: { target: [ankleX, ankleY, 4] },
        r: { target: [farAnkleX, farAnkleY, 1] },
      },
      arms: {
        l: { target: [48, 195, 0] },
        r: { target: [-48, 195, 0] },
      },
    };
  },
} satisfies FrontExercise;
