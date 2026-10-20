// Leaning back from a fixed close handhold. The tucked working elbow rows the torso toward the support.
// The feet stay planted and the non-working hand rests by the hip.
import type { SideExercise } from '@/exercise.ts';
import { standingBodyRow } from './_horizontal-row-1.ts';

export default standingBodyRow({
  id: 'bodyweight-standing-close-grip-single-arm-row',
  name: '自重站姿窄握单臂划船',
  meta: { en: 'Bodyweight Standing Close-Grip Single-Arm Row', family: 'horizontal-row', equipment: ['bodyweight', 'pull-up-bar'], sources: ['hz:3156'] },
}, { single: true }) satisfies SideExercise;
