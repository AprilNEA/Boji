// Start in a straight passive hang with both hands fixed on the pull-up bar.
// Raise the rigid body into a horizontal front lever while the elbows stay locked.
// Lower through the same controlled arc until the legs hang below the shoulders again.
import type { SideExercise } from '@/exercise.ts';
import { timeline } from '@/math.ts';
import { pullUpBar } from '@/exercises/equipment/index.ts';
import { frontLeverRaisePose, LEVER_BAR } from './_core-stability-2.ts';

const tl = timeline([
  { d: 1.35, from: 0, to: 1, e: [0.52, 1] }, { d: 0.65, from: 1, to: 1, e: [1, 0.92] },
  { d: 1.45, from: 1, to: 0, e: [0.92, 0.5] }, { d: 0.35, from: 0, to: 0, e: [0.48, 0.48] },
]);
const bar = pullUpBar({ view: 'side', x: LEVER_BAR.frontWrist[0], y: LEVER_BAR.y });
export default {
  id: 'front-lever-raise', name: '前水平举起', tl,
  meta: { en: 'Front Lever Raise', family: 'core-stability', equipment: ['pull-up-bar'], sources: ['hz:3295'] },
  muscles: [
    { m: 'upperBack' }, { m: 'abs', scale: 0.74 }, { m: 'delts', side: 'both', scale: 0.5 },
  ],
  props: (pal) => ({ back: bar.draw(pal) }), propsBox: bar.box, poster: 0.32,
  pose: (t) => frontLeverRaisePose(tl.at(t).p),
} satisfies SideExercise;
