// Stand with one kettlebell overhead and the free arm held behind the back.
// Shift the hips and side-bend while the loaded arm remains straight and vertically stacked.
import type { FrontExercise } from '@/exercise.ts';
import { windmill } from './_kettlebell-ballistic.ts';

export default windmill({ id: 'kettlebell-windmill-with-free-arm-behind-back', name: '壶铃单臂背手风车', en: 'Kettlebell Windmill with Free Arm Behind Back', sources: ['fe:Advanced_Kettlebell_Windmill'] }, { behind: true }) satisfies FrontExercise;
