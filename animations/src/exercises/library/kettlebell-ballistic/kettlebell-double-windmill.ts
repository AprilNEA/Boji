// Stand with one bell overhead and a second bell controlled by the free hand.
// Hinge sideways to lower the free-hand bell while the overhead elbow stays locked.
import type { FrontExercise } from '@/exercise.ts';
import { windmill } from './_kettlebell-ballistic.ts';

export default windmill({ id: 'kettlebell-double-windmill', name: '双壶铃风车', en: 'Kettlebell Double Windmill', sources: ['fe:Double_Kettlebell_Windmill', 'hz:0530'] }, { double: true }) satisfies FrontExercise;
