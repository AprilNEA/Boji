// Sit back on a 45-degree incline bench with the bar at shoulder height and feet planted.
// Press the bar overhead to full arm extension, then lower it under control to shoulder height.
import type { SideExercise } from '@/exercise.ts';
import { inclinePress } from './_rotator-cuff.ts';
export default inclinePress({ id: 'barbell-incline-shoulder-raise', name: '杠铃上斜推举', en: 'Barbell Incline Shoulder Raise', sources: ['hz:0050'], load: 'barbell' }) satisfies SideExercise;
