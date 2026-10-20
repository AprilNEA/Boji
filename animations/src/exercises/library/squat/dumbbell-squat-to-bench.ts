// Dumbbell squat to bench, side view. The dumbbells hang at the sides while a flat bench sits directly behind the hips.
// The glutes lightly touch the bench at the bottom, and the legs press through flat feet back to standing.
import type { SideExercise } from '@/exercise.ts';
import { flatBench, dumbbell } from '@/exercises/equipment/index.ts';
import { hangingArms, squatPose, squatTL, X0 } from './_squat-2.ts';

const tl = squatTL(0.4);
const bench = flatBench({ view: 'side', x: X0 - 102, top: 90, length: 176 });
export default {
  id: 'dumbbell-squat-to-bench', name: '哑铃凳式深蹲', tl,
  meta: { en: 'Dumbbell Squat To A Bench', family: 'squat', equipment: ['dumbbell', 'bench'], sources: ['fe:Dumbbell_Squat_To_A_Bench'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.4 }, { m: 'calves', side: 'both', scale: 0.25 }, { m: 'lowerBack', scale: 0.25 }],
  props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
  dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')],
  pose: (t) => squatPose(tl.at(t).p, hangingArms(), { farDx: -6, back: 78, bottom: 90, lean: 39 }),
} satisfies SideExercise;
