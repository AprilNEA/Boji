// Stand with one kettlebell held overhead at a locked elbow.
// Shift the hips and side-bend toward the free hand while the overhead bell stays vertically stacked.
import type { FrontExercise } from '@/exercise.ts';
import { windmill } from './_kettlebell-ballistic.ts';

export default windmill({ id: 'kettlebell-windmill', name: '壶铃风车', en: 'Kettlebell Windmill', sources: ['fe:Kettlebell_Windmill', 'hz:0517', 'hz:0554'] }) satisfies FrontExercise;
