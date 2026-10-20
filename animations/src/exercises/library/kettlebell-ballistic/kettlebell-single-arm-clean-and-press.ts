// Start in a hinge with one bell hanging between the legs.
// Clean to the shoulder, then press to a straight overhead elbow before lowering under control.
import type { SideExercise } from '@/exercise.ts';
import { cleanPress } from './_kettlebell-ballistic.ts';

export default cleanPress({ id: 'kettlebell-single-arm-clean-and-press', name: '壶铃单臂翻铃推举', en: 'Kettlebell Single-Arm Clean and Press', sources: ['hz:0543'] }) satisfies SideExercise;
