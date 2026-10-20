// Leaning back from a fixed handhold. The working elbow rows the torso toward the support.
// The feet stay planted and the non-working hand rests by the hip.
import type { SideExercise } from '@/exercise.ts';
import { standingBodyRow } from './_horizontal-row-1.ts';

export default standingBodyRow({
  id: 'bodyweight-standing-single-arm-row',
  name: '自重站姿单臂划船',
  meta: { en: 'Bodyweight Standing Single-Arm Row', family: 'horizontal-row', equipment: ['bodyweight', 'pull-up-bar'], sources: ['hz:3162'] },
}, { single: true }) satisfies SideExercise;
