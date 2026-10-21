// 标准俯卧撑 (push-up). High plank on the toes: the straight body pivots on the feet and the wrists stay planted. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { HIGH_PLANK, plantedArm } from '@/exercises/common.ts';

const pushTL = timeline([
  { d: 1.5, from: 0, to: 1, e: [0.35, 0.6] },
  { d: 0.2, from: 1, to: 1, e: [0.6, 0.8] },
  { d: 1.0, from: 1, to: 0, e: [1, 0.85] },
  { d: 0.7, from: 0, to: 0, e: [0.85, 0.35] },
]);


const pushUp = {
  id: 'push-up', name: '标准俯卧撑', tl: pushTL, mat: true,
  meta: { en: 'Push-Up', family: 'push-up', equipment: ['bodyweight', 'mat'], sources: ['fe:Pushups', 'hz:1689', 'hz:0662'] },
  muscles: [
    { m: 'pecs' },
    { m: 'triceps', side: 'both' },
    { m: 'abs', scale: 0.45 },
    { m: 'delts', side: 'near', scale: 0.5 },
  ],
  pose(t) {
    const { p } = pushTL.at(t);
    return {
      ...HIGH_PLANK.body(lerp(HIGH_PLANK.top, HIGH_PLANK.bottom, p)),
      arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) },
    };
  },
} satisfies Exercise;

export default pushUp;
