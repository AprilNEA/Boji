// Single-leg calf raise on a low step with a dumbbell at the working-side arm.
// The working forefoot stays on the step as the heel drops below it, then rises high.
// The free leg stays lifted and the opposite hand keeps a fixed wall contact.
import type { SideExercise } from '@/exercise.ts';
import { aerobicStep } from '@/exercises/equipment/index.ts';
import { standingCalves } from './_calf-raise-1.ts';

const step = aerobicStep({ x: 302, h: 31, w: 130 });

export default standingCalves({
  id: 'dumbbell-single-leg-calf-raise', name: '哑铃单腿提踵',
  meta: {
    en: 'Dumbbell Single-Leg Calf Raise', family: 'calf-raise', equipment: ['dumbbell', 'step', 'wall'],
    sources: ['hz:0409'],
  },
  single: true, arms: 'dumbbell-wall', baseH: 31, start: -8, top: 30,
  props: (pal) => ({ back: step.draw(pal) }),
  propsBox: [step.box[0], 412],
}) satisfies SideExercise;
