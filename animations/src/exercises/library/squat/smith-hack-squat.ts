// Stand under the Smith bar across the upper traps with the feet set forward of the rail and shoulder-width apart.
// Lower with the chest up until parallel or slightly below, then press through the heels to return under the guided bar.
import type { SideExercise } from '@/exercise.ts';
import { smithSquat } from './_squat-3.ts';

export default smithSquat({
  id: 'smith-hack-squat', name: '史密斯哈克深蹲', en: 'Smith Hack Squat', sources: ['hz:0755'], chair: true, feet: 313,
}) satisfies SideExercise;
