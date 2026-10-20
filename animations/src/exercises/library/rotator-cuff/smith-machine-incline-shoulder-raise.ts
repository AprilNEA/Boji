// Lie on an incline bench beneath the Smith bar with a shoulder-width grip and elbows nearly straight.
// Reach upward through the shoulder blades to raise the fixed-path bar, then return to the starting reach.
import type { SideExercise } from '@/exercise.ts';
import { inclineScapularRaise } from './_rotator-cuff.ts';
export default inclineScapularRaise({ id: 'smith-machine-incline-shoulder-raise', name: '史密斯上斜肩胛前伸', en: 'Smith Machine Incline Shoulder Raise', sources: ['fe:Smith_Incline_Shoulder_Raise'], load: 'barbell', smith: true }) satisfies SideExercise;
