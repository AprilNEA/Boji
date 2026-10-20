// Kneel on the floor behind a bench and grip the loaded bar on the bench surface.
// Roll the bar forward on the pad as the hips extend and the arms reach overhead.
import type { SideExercise } from '@/exercise.ts';
import { flatBench, barbell, gripAt, PLATE, workTL } from '@/exercises/equipment/index.ts';
import { rolloutPose } from './_core-stability-1.ts';

const tl = workTL(0.55);
const bench = flatBench({ view: 'side', x: 430, top: 90, length: 190 });
const spec = {
  knee: [210, 435] as [number, number], hip0: [210, 341] as [number, number], hip1: [250, 351] as [number, number],
  spine0: -15, spine1: -10, bar0: 410, bar1: 470, barY: bench.seatY - PLATE.small / 2,
};

export default {
  id: 'barbell-kneeling-bench-rollout',
  name: '杠铃跪姿凳上健腹滚动',
  tl,
  meta: { en: 'Barbell Kneeling Bench Rollout', family: 'core-stability', equipment: ['barbell', 'bench'], sources: ['hz:0083'] },
  muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.45 }, { m: 'triceps', side: 'both', scale: 0.3 }],
  props: (pal) => ({ back: bench.draw(pal) }),
  dynamic: [barbell({ view: 'side', plate: 'small', at: (J) => ({ p: gripAt(J, 'n') }) })],
  propsBox: [160, bench.box[1]],
  poster: 0.28,
  pose: (t) => rolloutPose(tl.at(t).p, spec),
} satisfies SideExercise;
