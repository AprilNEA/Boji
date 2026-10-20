// Lie back on an incline bench with a dumbbell above each shoulder and the elbows locked softly.
// Lift through the shoulder blades only so both dumbbells rise a short controlled distance together.
import type { SideExercise } from '@/exercise.ts';
import { inclineScapularRaise } from './_rotator-cuff.ts';
export default inclineScapularRaise({ id: 'dumbbell-incline-scapular-raise', name: '哑铃上斜肩胛前伸', en: 'Dumbbell Incline Scapular Raise', sources: ['fe:Dumbbell_Incline_Shoulder_Raise'], load: 'dumbbell' }) satisfies SideExercise;
