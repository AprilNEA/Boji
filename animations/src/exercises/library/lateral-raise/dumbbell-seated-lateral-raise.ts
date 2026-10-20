// Sit upright on a flat bench with planted feet and dumbbells beside the thighs.
// Raise both soft-elbow arms to shoulder height without swinging the torso, then lower slowly.
import type { FrontExercise } from '@/exercise.ts';
import { dumbbellLateral } from './_lateral-raise.ts';
export default dumbbellLateral({ id: 'dumbbell-seated-lateral-raise', name: '哑铃坐姿侧平举', en: 'Dumbbell Seated Lateral Raise', sources: ['fe:Seated_Side_Lateral_Raise', 'hz:0396', 'hz:0395'] }, { seated: true }) satisfies FrontExercise;
