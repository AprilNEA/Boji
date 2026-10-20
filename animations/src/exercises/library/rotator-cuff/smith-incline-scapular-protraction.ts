// Lie back beneath the Smith bar on a 45-degree incline with the elbows nearly locked.
// Reach through the shoulder blades to lift the fixed-path bar a short distance, then return to the pad.
import type { SideExercise } from '@/exercise.ts';
import { inclineScapularRaise } from './_rotator-cuff.ts';
export default inclineScapularRaise({ id: 'smith-incline-scapular-protraction', name: '史密斯上斜肩胛前伸', en: 'Smith Incline Scapular Protraction', sources: ['hz:0759'], load: 'barbell', smith: true }) satisfies SideExercise;
