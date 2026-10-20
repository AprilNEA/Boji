// Start kneeling with both knees on the mat and both hands resting on a foam roller.
// Roll the support forward while the hips glide forward to open the front of the hips.
// The knees stay fixed on the mat and the hands stay on top of the roller.
import type { SideExercise } from '@/exercise.ts';
import type { Joints } from '@/rig.ts';
import { FLOOR, QUAD, kneelLeg, plantedArm } from '@/exercises/common.ts';
import { ROLLER, foamRoller } from '@/exercises/equipment/index.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const rollerAt = (p: number): [number, number] => [QUAD.wrist[0] + 10 * p, FLOOR - ROLLER.r];

export default {
  id: 'foam-roller-kneeling-hip-stretch', name: '泡沫轴跪姿髋部拉伸', tl, mat: true,
  meta: { en: 'Foam Roller Kneeling Hip Stretch', family: 'stretch-lower', equipment: ['foam-roller', 'mat'], sources: ['hz:2205'] },
  muscles: [{ m: 'glutes' }, { m: 'hipFlexor', scale: 0.55 }, { m: 'quads', side: 'both', scale: 0.3 }],
  dynamic: [foamRoller<Joints>((_J, t) => ({ p: rollerAt(tl.at(t).p) }), 'end')],
  pose(t) {
    const p = tl.at(t).p;
    const hip: [number, number] = [QUAD.hip[0] + 16 * p, QUAD.hip[1]];
    const roller = rollerAt(p);
    return {
      hip,
      spine: { lumbar: QUAD.spine.lumbar + 4 * p, thoracic: QUAD.spine.thoracic + 4 * p },
      neck: -12 + 4 * p, head: -10 + 4 * p,
      legs: { near: kneelLeg(hip), far: kneelLeg([hip[0] - 3, hip[1]]) },
      arms: { near: plantedArm([roller[0], roller[1] - ROLLER.r]), far: plantedArm([roller[0] - 4, roller[1] - ROLLER.r]) },
    };
  },
} satisfies SideExercise;
