// Hold the pull-up bar with fixed hands and elbows locked straight.
// Keep the whole body horizontal in front of the bar with the legs together.
// Maintain the static front-lever line without piking at the hips or knees.
import type { SideExercise } from '@/exercise.ts';
import { pullUpBar } from '@/exercises/equipment/index.ts';
import { frontLeverPose, holdWave, LEVER_BAR } from './_core-stability-2.ts';

const bar = pullUpBar({ view: 'side', x: LEVER_BAR.frontWrist[0], y: LEVER_BAR.y });
export default {
  id: 'front-lever', name: '前水平', tl: { total: 4 },
  meta: { en: 'Front Lever', family: 'core-stability', equipment: ['pull-up-bar'], sources: ['hz:3296'] },
  muscles: [
    { m: 'abs', e: (t) => 0.85 + 0.1 * holdWave(t) }, { m: 'lats', side: 'both', scale: 0.72, e: () => 0.77 },
    { m: 'delts', side: 'both', scale: 0.5, e: () => 0.58 }, { m: 'forearms', side: 'both', scale: 0.36, e: () => 0.5 },
  ],
  props: (pal) => ({ back: bar.draw(pal) }), propsBox: bar.box, poster: 0.25,
  pose: () => frontLeverPose(),
} satisfies SideExercise;
