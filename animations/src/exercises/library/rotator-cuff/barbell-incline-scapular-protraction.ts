// Lie back on a 45-degree incline bench with the bar above the upper chest and elbows almost locked.
// Reach the shoulders toward the ceiling to raise the bar a short distance, then settle them back to the pad.
import type { SideExercise } from '@/exercise.ts';
import { inclineScapularRaise } from './_rotator-cuff.ts';
export default inclineScapularRaise({ id: 'barbell-incline-scapular-protraction', name: '杠铃上斜肩胛前伸', en: 'Barbell Incline Scapular Protraction', sources: ['fe:Barbell_Incline_Shoulder_Raise'], load: 'barbell' }) satisfies SideExercise;
