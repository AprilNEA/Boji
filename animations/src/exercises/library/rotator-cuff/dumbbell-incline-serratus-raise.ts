// Sit back on a 45-degree incline bench with dumbbells at shoulder height and palms forward.
// Press both dumbbells upward with a slight soft elbow, then lower them to the shoulders.
import type { SideExercise } from '@/exercise.ts';
import { inclinePress } from './_rotator-cuff.ts';
export default inclinePress({ id: 'dumbbell-incline-serratus-raise', name: '哑铃上斜推举', en: 'Dumbbell Incline Serratus Raise', sources: ['hz:0328'], load: 'dumbbell' }) satisfies SideExercise;
