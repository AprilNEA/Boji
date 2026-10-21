// Wall-sit march, side view. The back stays against the wall at a right-angle knee bend while the feet alternate.
// One knee lifts toward the chest at a time; the supporting foot stays flat and the pelvis never rises from the wall.
import type { SideExercise } from '@/exercise.ts';
import { timeline } from '@/math/timeline.ts';
import { A, G } from '@/exercises/common.ts';
import { hangingArms } from './_squat-2.ts';

const tl = timeline([{ d: 2.8, from: 0, to: 0, ease: 'linear', e: [0.75, 0.75] }]);
const WALL_X = 150, HIP_X = WALL_X + 18;
const HIP_Y = G - A - 92;
const ANKLE: [number, number] = [HIP_X + 96, G - A];
const UP: [number, number] = [HIP_X + 73, G - A - 86];
const lift = (t: number, s: 1 | -1): number => Math.max(0, s * Math.sin(Math.PI * 2 * t));
export default {
  id: 'wall-sit-march', name: '靠墙静蹲交替抬腿', tl,
  meta: { en: 'Wall Sit March', family: 'squat', equipment: ['bodyweight', 'wall'], sources: ['hz:0624'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.55 }, { m: 'hipFlexor', side: 'near', scale: 0.45, e: (t) => lift(t, 1) }, { m: 'hipFlexor', side: 'far', scale: 0.45, e: (t) => lift(t, -1) }],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'wall', color: pal.prop, c: [WALL_X - 30, 241], s: [60, 422], r: 6 },
    { kind: 'box', nm: 'baseboard', color: pal.propDark, c: [WALL_X - 30, G - 8], s: [60, 16], r: 2 },
  ] }),
  propsBox: [WALL_X - 60, ANKLE[0] + 30],
  pose(t) {
    const near = lift(t, 1), far = lift(t, -1);
    const at = (u: number): [number, number] => [ANKLE[0] + (UP[0] - ANKLE[0]) * u, ANKLE[1] + (UP[1] - ANKLE[1]) * u];
    return {
      hip: [HIP_X, HIP_Y], spine: { lumbar: -90, thoracic: -90 }, neck: -89, head: -89,
      legs: {
        near: { target: at(near), foot: near ? -45 : 0, side: [1, 0] },
        far: { target: [at(far)[0] - 5, at(far)[1]], foot: far ? -45 : 0, side: [1, 0] },
      },
      arms: hangingArms(),
    };
  },
} satisfies SideExercise;
