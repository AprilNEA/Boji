// Start in a high plank with straight body line and hands directly below the shoulders.
// Keep one hand planted as the other arm reaches vertically to open the chest.
// Return to the stable plank before repeating to the other side.
import type { SideExercise } from '@/exercise.ts';
import { add, ang, dir, lerp, mul, sub } from '@/math/vec2.ts';
import { HIGH_PLANK } from '@/exercises/common.ts';
import { alternatingTL, alternate } from './_core-rotation-1.ts';

export default {
  id: 'plank-rotation', name: '平板支撑转体', tl: alternatingTL, mat: true, poster: 0.14,
  meta: { en: 'Plank Rotation', family: 'core-rotation', equipment: ['bodyweight'], sources: ['hz:0464'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.75 }, { m: 'delts', side: 'both', scale: 0.6 }],
  pose(t) {
    const { p, near } = alternate(t);
    const openArm = (S: [number, number], wrist: [number, number]): [number, number] => {
      const v = sub(wrist, S);
      return add(S, mul(dir(lerp(ang(v), -90, p)), Math.hypot(v[0], v[1])));
    };
    return {
      ...HIGH_PLANK.body(HIGH_PLANK.top),
      arms: near
        ? {
          // Both hands begin below the shoulders. The working arm then opens nearly straight overhead.
          near: { target: (J) => openArm(J.S, HIGH_PLANK.wrist), side: [-1, 0], hand: -90 },
          far: { target: HIGH_PLANK.wristFar, side: [-1, 0], hand: 0 },
        }
        : {
          near: { target: HIGH_PLANK.wrist, side: [-1, 0], hand: 0 },
          far: { target: (J) => openArm(J.Sf, HIGH_PLANK.wristFar), side: [-1, 0], hand: -90 },
        },
    };
  },
} satisfies SideExercise;
