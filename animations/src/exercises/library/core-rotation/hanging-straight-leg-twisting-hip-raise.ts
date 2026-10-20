// Hang from a fixed pull-up bar with straight arms and both legs together below the hips.
// Raise the straight legs toward parallel while rotating the pelvis to alternate sides.
// The bar grip stays fixed and the knees remain almost fully extended at the top.
import type { FrontExercise } from '@/exercise.ts';
import { GROUND } from '@/rig.ts';
import { pullUpBar } from '@/exercises/equipment/index.ts';

const BAR_Y = 30, BAR_H = GROUND - BAR_Y;
const bar = pullUpBar({ view: 'front', y: BAR_Y, width: 248 });
const wave = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'hanging-straight-leg-twisting-hip-raise', name: '悬垂直腿转体举髋', view: 'front', tl: { total: 3.4 },
  meta: { en: 'Hanging Straight-Leg Twisting Hip Raise', family: 'core-rotation', equipment: ['pull-up-bar'], sources: ['hz:0476'] },
  muscles: [{ m: 'abs', e: () => 0.9 }, { m: 'obliques', scale: 0.8, e: () => 0.84 }, { m: 'hipFlexor', scale: 0.52, e: () => 0.72 }],
  props: (pal) => ({ back: bar.draw(pal) }), propsBox: bar.box,
  poster: 0.25,
  pose(t) {
    const u = wave(t), lift = Math.abs(u), side = 28 * u;
    const ay = 13 + 182 * lift, az = 5 + 175 * lift;
    return {
      pelvis: [0, 195, 0], spine: { yaw: 20 * u }, head: { yaw: 9 * u },
      legs: {
        l: { target: [side + 17, ay, az], pole: [26, -58, 32] },
        r: { target: [side - 17, ay, az], pole: [-26, -58, 32] },
      },
      arms: {
        l: { target: [45, BAR_H, 0], pole: [42, -8, -35] },
        r: { target: [-45, BAR_H, 0], pole: [-42, -8, -35] },
      },
    };
  },
} satisfies FrontExercise;
