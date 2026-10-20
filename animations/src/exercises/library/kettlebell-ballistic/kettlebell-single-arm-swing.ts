// Start in a hip hinge with the bell between the legs.
// Drive the hips forward to swing one straight arm to chest height. The feet stay planted.
import type { SideExercise } from '@/exercise.ts';
import { swing } from './_kettlebell-ballistic.ts';

export default swing({ id: 'kettlebell-single-arm-swing', name: '壶铃单臂摆荡', en: 'Kettlebell Single-Arm Swing', sources: ['fe:One-Arm_Kettlebell_Swings'] }, true) satisfies SideExercise;
