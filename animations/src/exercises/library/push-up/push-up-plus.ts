// Begin in a high plank with straight arms and a neutral line from head to heels.
// Perform a full push-up, then actively push the floor away to protract the shoulder blades at the top.
import type { SideExercise } from '@/exercise.ts';
import { addScaled } from '@/math/vec2.ts';
import { solve } from '@/rig/side.ts';
import { floorPose, PUSH_TL, pushMuscles } from './_push-up-2.ts';

/** Thorax rise at the top, in px. */
const PLUS = 5;

export default {
  id: 'push-up-plus', name: '俯卧撑加肩胛前伸', tl: PUSH_TL, mat: true,
  meta: { en: 'Push-Up Plus', family: 'push-up', equipment: ['bodyweight'], sources: ['hz:3145'] },
  muscles: [...pushMuscles(), { m: 'upperBack', scale: 0.45 }],
  pose: (t: number) => {
    const p = PUSH_TL.at(t).p;
    // Protraction: the hands and the shoulder joints stay put and the thorax rises away from the floor.
    // A negative shoulderShift moves the shoulder joint toward the front of the torso. The torso moves back by
    // the same distance, so the straight arms keep their length.
    const plus = PLUS * (1 - p);
    const base = floorPose(p);
    const front = solve(base).A(0.86);
    return { ...floorPose(p, { shoulderShift: -plus }), hip: addScaled(base.hip, front, -plus) };
  },
} satisfies SideExercise;
