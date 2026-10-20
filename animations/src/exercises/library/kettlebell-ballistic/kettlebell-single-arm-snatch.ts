// Start with one bell in a backswing between the legs and the knees soft.
// Drive the hips, rotate the hand and punch to a locked overhead position. The feet stay planted.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_kettlebell-ballistic.ts';

export default snatch({ id: 'kettlebell-single-arm-snatch', name: '壶铃单臂抓举', en: 'Kettlebell Single-Arm Snatch', sources: ['fe:One-Arm_Kettlebell_Snatch', 'hz:0542'] }, false) satisfies SideExercise;
