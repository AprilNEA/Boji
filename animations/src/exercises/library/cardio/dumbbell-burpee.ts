// Begin in a stable dumbbell high plank and jump the feet forward into a loaded squat.
// Stand explosively and press both dumbbells to a fully extended overhead lockout.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellBurpee } from './_cardio-2.ts';

export default {
  ...dumbbellBurpee({ en: 'Dumbbell Burpee', sources: ['hz:1201'] }, '哑铃波比跳'),
  id: 'dumbbell-burpee',
} satisfies SideExercise;
