// Carioca quick step, front view. One foot crosses behind while the other knee drives high with a brisk arm block.
// The torso stays tall and faces forward. The lifted foot clears the floor before the feet exchange roles.
import type { FrontExercise } from '@/exercise.ts';
import { add3 } from '@/math3.ts';
import { BODY } from '@/rig.ts';
import { toeDir } from '@/front-rig.ts';
import { cardioTL } from './_cardio-1.ts';

const TAU = Math.PI * 2;

export default {
  id: 'carioca-quick-step',
  name: '侧向交叉高抬腿步',
  view: 'front',
  tl: cardioTL(1.0),
  poster: 0.25,
  meta: { en: 'Carioca Quick Step', family: 'cardio', equipment: ['bodyweight'], sources: ['fe:Carioca_Quick_Step'] },
  muscles: [{ m: 'adductors', side: 'both' }, { m: 'quads', side: 'both', scale: 0.6 }, { m: 'calves', side: 'both', scale: 0.4 }],
  pose(t) {
    const c = Math.cos(TAU * t), s = Math.sin(TAU * t);
    const left = Math.max(0, s), right = Math.max(0, -s);
    return {
      pelvis: [0, BODY.ankleH + 182, 0], hips: { yaw: 5 * c }, spine: { yaw: 5 * c },
      // The swinging foot travels across the midline before the knee drives up.
      legs: {
        l: { target: [20 - 31 * left, BODY.ankleH + 61 * left, 3], dir: toeDir([0, 0, 1]) },
        r: { target: [-20 + 31 * right, BODY.ankleH + 61 * right, 3], dir: toeDir([0, 0, 1]) },
      },
      arms: {
        l: { target: (J) => add3(J.shoulder_l, [18, -80, -29 * c]) },
        r: { target: (J) => add3(J.shoulder_r, [-18, -80, 29 * c]) },
      },
    };
  },
} satisfies FrontExercise;
