// Kneel on the bench with the knees fixed on its pad and grip the loaded bar on the floor.
// Hinge from the knees as the bar rolls forward, keeping the arms long and the trunk braced.
import type { SideExercise } from '@/exercise.ts';
import { flatBench, barbell, gripAt, PLATE, workTL } from '@/exercises/equipment/index.ts';
import { rolloutPose } from './_core-stability-1.ts';

const tl = workTL(0.55);
const bench = flatBench({ view: 'side', x: 210, top: 90, length: 180 });
const spec = {
  knee: [210, bench.seatY - 11] as [number, number], hip0: [210, bench.seatY - 105] as [number, number], hip1: [250, bench.seatY - 95] as [number, number],
  spine0: 30, spine1: 30, bar0: 350, bar1: 395, barY: 431,
};

export default {
  id: 'barbell-bench-kneeling-ab-rollout',
  name: '杠铃凳上跪姿健腹滚动',
  tl,
  meta: { en: 'Barbell Bench Kneeling Ab Rollout', family: 'core-stability', equipment: ['barbell', 'bench'], sources: ['fe:Barbell_Rollout_from_Bench'] },
  muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.45 }, { m: 'glutes', scale: 0.3 }, { m: 'lats', scale: 0.3 }],
  props: (pal) => ({ back: bench.draw(pal) }),
  dynamic: [barbell({ view: 'side', plate: 'small', at: (J) => ({ p: gripAt(J, 'n') }) })],
  propsBox: [bench.box[0], spec.bar1 + PLATE.small / 2],
  poster: 0.28,
  pose: (t) => rolloutPose(tl.at(t).p, spec),
} satisfies SideExercise;
