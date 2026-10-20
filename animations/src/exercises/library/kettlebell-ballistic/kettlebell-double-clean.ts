// Start hinged with one kettlebell in each hand below the shoulders.
// Extend the hips and knees, then rotate both bells into a shoulder rack. The feet stay planted.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_kettlebell-ballistic.ts';

export default clean({ id: 'kettlebell-double-clean', name: '双壶铃翻举', en: 'Kettlebell Double Clean', sources: ['fe:Two-Arm_Kettlebell_Clean'] }, 'double') satisfies SideExercise;
