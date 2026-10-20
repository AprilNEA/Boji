// Hold the bar across the upper back with a flat bench behind the hips.
// Sit back under control until the glutes lightly touch the bench.
// Keep the feet flat and stand without collapsing onto the support.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-back-squat-to-bench',
  name: '杠铃背蹲触凳',
  en: 'Barbell Back Squat to Bench',
  equipment: ['barbell', 'bench'],
  sources: ['fe:Barbell_Squat_To_A_Bench'],
}, { bench: 'bench' }) satisfies import('@/exercise.ts').SideExercise;
