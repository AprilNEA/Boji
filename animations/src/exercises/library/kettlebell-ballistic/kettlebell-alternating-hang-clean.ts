// One bell rests in the rack while the other hangs between the legs.
// The bells exchange positions through hip drive, with one hand controlling each bell.
import type { SideExercise } from '@/exercise.ts';
import { alternatingClean } from './_kettlebell-ballistic.ts';

export default alternatingClean({ id: 'kettlebell-alternating-hang-clean', name: '壶铃交替悬垂翻举', en: 'Kettlebell Alternating Hang Clean', sources: ['fe:Alternating_Hang_Clean', 'hz:0518', 'hz:0526', 'fe:Double_Kettlebell_Alternating_Hang_Clean'] }) satisfies SideExercise;
