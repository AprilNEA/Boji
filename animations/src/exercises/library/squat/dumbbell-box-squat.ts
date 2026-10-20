// Dumbbell box squat, side view. The source places a dumbbell on the floor in front of a bench rather than in the hands.
// The athlete faces away from the bench, touches it with the glutes, then stands through planted heels.
import type { SideExercise } from '@/exercise.ts';
import { flatBench } from '@/exercises/equipment/index.ts';
import { hangingArms, squatPose, squatTL, X0 } from './_squat-2.ts';

const tl = squatTL(0.45);
const bench = flatBench({ view: 'side', x: X0 - 103, top: 90, length: 174 });
export default {
  id: 'dumbbell-box-squat', name: '哑铃箱式深蹲', tl,
  meta: { en: 'Dumbbell Box Squat', family: 'squat', equipment: ['dumbbell', 'bench'], sources: ['hz:0291'] },
  muscles: [{ m: 'glutes' }, { m: 'quads', side: 'both', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.4 }, { m: 'calves', side: 'both', scale: 0.25 }],
  props: (pal) => ({ back: [
    ...bench.draw(pal),
    { kind: 'oval', nm: 'floor-dumbbell', color: pal.plate, c: [X0 + 52, 432], s: [28, 28] },
    { kind: 'oval', nm: 'floor-dumbbell-face', color: pal.metalDark, c: [X0 + 52, 432], s: [19, 19] },
  ] }), propsBox: [bench.box[0], X0 + 70],
  pose: (t) => squatPose(tl.at(t).p, hangingArms(), { farDx: -6, back: 78, bottom: 90, lean: 39 }),
} satisfies SideExercise;
