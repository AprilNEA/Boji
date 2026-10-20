// Kneel on the floor with the knees fixed, then hinge forward as the loaded bar rolls away.
// The plates stay on the floor, and the straightening arms follow the rolling bar before returning.
import type { SideExercise } from '@/exercise.ts';
import { barbell, gripAt, PLATE, workTL } from '@/exercises/equipment/index.ts';
import { rolloutPose } from './_core-stability-1.ts';

const tl = workTL(0.55);
const spec = {
  knee: [210, 435] as [number, number], hip0: [210, 341] as [number, number], hip1: [250, 351] as [number, number],
  spine0: -15, spine1: -10, bar0: 359, bar1: 445, barY: 431,
};

export default {
  id: 'barbell-kneeling-ab-rollout',
  name: '杠铃跪姿健腹滚动',
  tl,
  mat: true,
  meta: { en: 'Barbell Kneeling Ab Rollout', family: 'core-stability', equipment: ['barbell'], sources: ['fe:Barbell_Ab_Rollout_-_On_Knees', 'hz:0084'] },
  muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.45 }, { m: 'lowerBack', scale: 0.3 }],
  dynamic: [barbell({ view: 'side', plate: 'small', at: (J) => ({ p: gripAt(J, 'n') }) })],
  propsBox: [spec.bar0 - PLATE.small / 2, spec.bar1 + PLATE.small / 2],
  poster: 0.28,
  pose: (t) => rolloutPose(tl.at(t).p, spec),
} satisfies SideExercise;
