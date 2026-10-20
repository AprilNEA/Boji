// Start with one kettlebell hanging between the legs in a shallow hip hinge.
// Extend the hips and rotate the bell into a close shoulder rack without a floor reset.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_kettlebell-ballistic.ts';

export default clean({ id: 'kettlebell-hang-clean', name: '壶铃悬垂翻铃', en: 'Kettlebell Hang Clean', sources: ['hz:0535', 'fe:Kettlebell_Hang_Clean'] }, 'single') satisfies SideExercise;
