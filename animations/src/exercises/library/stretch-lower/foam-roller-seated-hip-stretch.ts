// Start seated with the legs long and a foam roller under the upper thighs.
// Lean on both hands behind the torso as the knees draw toward the chest over the roller.
// The hands remain on the mat and the roller stays beneath the thighs throughout the stretch.
import type { SideExercise } from '@/exercise.ts';
import type { Joints } from '@/rig/side.ts';
import { FLOOR } from '@/exercises/common.ts';
import { ROLLER, foamRoller } from '@/exercises/equipment/index.ts';
import { stretchTL } from './_stretch-lower-2.ts';

const tl = stretchTL;
const rollerAt = (p: number): [number, number] => [270 - 35 * p, FLOOR - ROLLER.r];

export default {
  id: 'foam-roller-seated-hip-stretch', name: '泡沫轴坐姿髋部拉伸', tl, mat: true,
  meta: { en: 'Foam Roller Seated Hip Stretch', family: 'stretch-lower', equipment: ['foam-roller', 'mat'], sources: ['hz:2202'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.4 }, { m: 'quads', side: 'both', scale: 0.3 }],
  dynamic: [foamRoller<Joints>((_J, t) => ({ p: rollerAt(tl.at(t).p) }), 'end')],
  pose(t) {
    const p = tl.at(t).p;
    return {
      hip: [188, FLOOR - 26], spine: { lumbar: -92 - 16 * p, thoracic: -92 - 16 * p }, neck: -90 - 16 * p, head: -90 - 16 * p,
      legs: { near: { a1: -70 * p, a2: 100 * p, foot: 0 }, far: { a1: 2 - 68 * p, a2: 2 + 102 * p, foot: 0 } },
      arms: { near: { target: [165, FLOOR - 8], side: [-1, 0], hand: 180 }, far: { target: [161, FLOOR - 8], side: [-1, 0], hand: 180 } },
    };
  },
} satisfies SideExercise;
