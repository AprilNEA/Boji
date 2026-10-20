// Hinge with soft knees and let the working kettlebell hang below the shoulder.
// Keep the torso still as the working elbow rows the bell toward the stomach.
import type { SideExercise } from '@/exercise.ts';
import { hingeRow } from './_horizontal-row-2.ts';

export default hingeRow({
  id: 'kettlebell-single-arm-bent-over-row', name: '壶铃单臂俯身划船', en: 'Single-Arm Kettlebell Bent-Over Row',
  equipment: ['kettlebell'], sources: ['fe:One-Arm_Kettlebell_Row', 'hz:0541'], weight: 'kettlebell', single: true,
}) satisfies SideExercise;
