// Hold the pull-up bar with both hands at a fixed height and straight elbows.
// Keep the chest facing the floor while the trunk and legs form one horizontal line.
// Maintain the static back-lever position without bending the knees or dropping the feet.
import type { SideExercise } from '@/exercise.ts';
import { pullUpBar } from '@/exercises/equipment/index.ts';
import { backLeverPose, holdWave, LEVER_BAR } from './_core-stability-2.ts';

const bar = pullUpBar({ view: 'side', x: LEVER_BAR.backWrist[0], y: LEVER_BAR.y });
export default {
  id: 'back-lever', name: '后水平', tl: { total: 4 },
  meta: { en: 'Back Lever', family: 'core-stability', equipment: ['pull-up-bar'], sources: ['hz:3297'] },
  muscles: [
    { m: 'upperBack', e: (t) => 0.84 + 0.1 * holdWave(t) }, { m: 'abs', scale: 0.62, e: () => 0.72 },
    { m: 'biceps', side: 'both', scale: 0.48, e: () => 0.57 }, { m: 'forearms', side: 'both', scale: 0.34, e: () => 0.5 },
  ],
  props: (pal) => ({ back: bar.draw(pal) }), propsBox: bar.box, poster: 0.25,
  pose: () => backLeverPose(),
} satisfies SideExercise;
