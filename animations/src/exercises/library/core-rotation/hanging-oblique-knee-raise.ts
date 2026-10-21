// Hang from a fixed pull-up bar with both elbows nearly straight and the palms over the bar.
// Lift the knees toward the chest while rotating the pelvis to alternate sides, then lower with control.
// Both hands remain fixed on the bar throughout the movement.
import type { FrontExercise } from '@/exercise.ts';
import { pullUpBar } from '@/exercises/equipment/index.ts';
import { GROUND } from '@/rig/side.ts';

const BAR_Y = 30, BAR_H = GROUND - BAR_Y;
const bar = pullUpBar({ view: 'front', y: BAR_Y, width: 248 });
const wave = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'hanging-oblique-knee-raise', name: '悬垂侧向屈膝举腿', view: 'front', tl: { total: 3.2 },
  meta: { en: 'Hanging Oblique Knee Raise', family: 'core-rotation', equipment: ['pull-up-bar'], sources: ['hz:1761'] },
  muscles: [{ m: 'abs', e: () => 0.88 }, { m: 'obliques', scale: 0.82, e: () => 0.85 }, { m: 'hipFlexor', scale: 0.45, e: () => 0.62 }],
  props: (pal) => ({ back: bar.draw(pal) }), propsBox: bar.box,
  poster: 0.25,
  pose(t) {
    const u = wave(t), lift = Math.abs(u), side = 44 * u;
    const ay = 13 + 147 * lift, az = 6 + 89 * lift;
    return {
      pelvis: [0, 195, 0], spine: { yaw: 24 * u }, head: { yaw: 12 * u },
      legs: {
        l: { target: [side + 15, ay, az], pole: [32, -35, 45] },
        r: { target: [side - 15, ay, az], pole: [-32, -35, 45] },
      },
      arms: {
        l: { target: [45, BAR_H, 0], pole: [42, -8, -35] },
        r: { target: [-45, BAR_H, 0], pole: [-42, -8, -35] },
      },
    };
  },
} satisfies FrontExercise;
