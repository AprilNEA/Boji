// Stand under a Smith bar placed across the upper traps, with feet shoulder-width and toes slightly turned out.
// Keep the rail vertical while descending below parallel, then drive through the heels back to the standing position.
import type { SideExercise } from '@/exercise.ts';
import { smithSquat } from './_squat-3.ts';

export default smithSquat({
  id: 'smith-full-squat', name: '史密斯全蹲', en: 'Smith Full Squat', sources: ['hz:3281'], deep: true,
}) satisfies SideExercise;
