// Lie face up inside the machine with the head and back supported, knees bent, feet shoulder-width on the platform.
// Press through the feet to extend the hips and knees, pause before lockout, then return to a parallel knee angle.
import type { SideExercise } from '@/exercise.ts';
import { supineLegPress } from './_squat-3.ts';

export default supineLegPress({
  id: 'machine-supine-squat', name: '器械仰卧深蹲', en: 'Machine Supine Squat', sources: ['fe:Lying_Machine_Squat'],
}) satisfies SideExercise;
