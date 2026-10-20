// Stand tall with the feet flat and both hands resting on the hips.
// Exhale and draw the abdomen inward while the pelvis and chest stay stacked.
// Hold the isometric contraction, then return to the same neutral standing stance.
import type { SideExercise } from '@/exercise.ts';
import { holdWave, standingVacuumPose } from './_core-stability-2.ts';

export default {
  id: 'standing-stomach-vacuum',
  name: '站姿腹部真空收缩',
  tl: { total: 4 },
  meta: { en: 'Standing Stomach Vacuum', family: 'core-stability', equipment: ['bodyweight'], sources: ['fe:Stomach_Vacuum'] },
  muscles: [{ m: 'abs', e: (t) => 0.76 + 0.16 * holdWave(t) }],
  poster: 0.25,
  pose: () => standingVacuumPose(),
} satisfies SideExercise;
