// Cross the arms over a bar resting on the front deltoids, with a bench behind the hips.
// Keep the elbows high and lower until the glutes lightly touch the bench.
// Stand through the heels without collapsing onto the bench.
import { makeFrontSquat } from './_squat-1.ts';

export default makeFrontSquat({
  id: 'barbell-cross-arm-front-squat-to-bench',
  name: '杠铃交叉抱臂触凳前蹲',
  en: 'Barbell Cross-Arm Front Squat to Bench',
  equipment: ['barbell', 'bench'],
  sources: ['fe:Front_Barbell_Squat_To_A_Bench'],
}, { grip: 'cross', bench: true }) satisfies import('@/exercise.ts').SideExercise;
