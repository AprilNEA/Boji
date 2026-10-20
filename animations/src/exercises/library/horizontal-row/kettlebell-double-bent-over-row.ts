// Hinge at the hips with a neutral spine and both kettlebells below the shoulders.
// Pull both bells toward the abdomen by driving the elbows behind the torso.
import type { SideExercise } from '@/exercise.ts';
import { hingeRow } from './_horizontal-row-2.ts';

export default hingeRow({
  id: 'kettlebell-double-bent-over-row', name: '壶铃双臂俯身划船', en: 'Double Kettlebell Bent-Over Row',
  equipment: ['kettlebell'], sources: ['fe:Two-Arm_Kettlebell_Row', 'hz:1345'], weight: 'kettlebell',
}) satisfies SideExercise;
