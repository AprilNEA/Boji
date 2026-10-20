// Hold one dumbbell while standing wide with soft knees and a flat, hinged back.
// Reach the dumbbell toward the opposite foot with trunk rotation, then return under control.
// The feet remain flat; the free hand stays near the hip for balance.
import type { FrontExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { frontDumbbell, workTL } from '@/exercises/equipment/index.ts';
import { standing } from './_core-rotation-2.ts';

const tl = workTL(0.3);
export default {
  id: 'dumbbell-spell-caster', name: '哑铃单臂交叉触足', view: 'front', tl,
  meta: { en: 'Dumbbell Spell Caster', family: 'core-rotation', equipment: ['dumbbell'], sources: ['hz:0777'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.7 }],
  dynamic: [frontDumbbell('l', 'end')],
  poster: 0.31,
  pose(t) {
    const p = tl.at(t).p;
    return {
      ...standing(48, lerp(160, 122, p), lerp(0, -20, p), lerp(16, 32, p)),
      arms: {
        l: { target: [lerp(22, -32, p), lerp(196, 112, p), lerp(72, 90, p)], pole: [40, -20, 35] },
        r: { target: [-54, 232, 28], pole: [-42, -14, 35] },
      },
    };
  },
} satisfies FrontExercise;
