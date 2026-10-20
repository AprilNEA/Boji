// Standing calf raise with the forefeet on a low step and both hands on a wall.
// The heel begins slightly below the step, rises over the forefoot, then returns to the stretch.
// The step and wall remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { aerobicStep } from '@/exercises/equipment/index.ts';
import { standingCalves } from './_calf-raise-1.ts';

const step = aerobicStep({ x: 302, h: 31, w: 130 });

export default standingCalves({
  id: 'bodyweight-standing-calf-raise-on-step', name: '徒手台阶站姿提踵',
  meta: {
    en: 'Bodyweight Standing Calf Raise on Step', family: 'calf-raise', equipment: ['bodyweight', 'step', 'wall'],
    sources: ['hz:1490'],
  },
  arms: 'wall', baseH: 31, start: -8, top: 30,
  props: (pal) => ({ back: step.draw(pal) }),
  propsBox: [step.box[0], 412],
}) satisfies SideExercise;
