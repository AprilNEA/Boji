// Stand on the machine platform with the back held against the angled pad and shoulders under the pads.
// Keep the feet planted, lower until the thighs reach parallel, then press through the heels without locking the knees.
import type { SideExercise } from '@/exercise.ts';
import { hackSquat } from './_squat-3.ts';

export default hackSquat({
  id: 'machine-hack-squat', name: '器械哈克深蹲', en: 'Machine Hack Squat',
  sources: ['fe:Hack_Squat', 'hz:0743'],
}) satisfies SideExercise;
