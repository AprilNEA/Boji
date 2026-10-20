// Start in a deep hinge with the kettlebell on the floor between the feet.
// Lift it into a shoulder rack through leg and hip extension, then return it under control.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_kettlebell-ballistic.ts';

export default clean({ id: 'kettlebell-single-arm-dead-clean', name: '壶铃单臂地面翻举', en: 'Kettlebell Single-Arm Dead Clean', sources: ['fe:Kettlebell_Dead_Clean'] }, 'dead') satisfies SideExercise;
