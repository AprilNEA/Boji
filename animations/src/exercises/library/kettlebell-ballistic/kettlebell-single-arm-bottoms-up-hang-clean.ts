// Start with one kettlebell hanging between the legs in a shallow hip hinge.
// Drive it to the shoulder and finish with the bell inverted above the handle. The grip stays firm.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_kettlebell-ballistic.ts';

export default clean({ id: 'kettlebell-single-arm-bottoms-up-hang-clean', name: '壶铃单臂倒置悬垂翻举', en: 'Kettlebell Single-Arm Bottoms-Up Hang Clean', sources: ['fe:Bottoms-Up_Clean_From_The_Hang_Position', 'hz:0525'] }, 'bottoms-up') satisfies SideExercise;
