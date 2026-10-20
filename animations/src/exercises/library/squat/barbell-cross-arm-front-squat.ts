// Rest the bar on the front deltoids and cross the arms over it for control.
// Keep the elbows high while lowering with an upright chest to below parallel.
// Push through the middle of the foot to return to standing.
import { makeFrontSquat } from './_squat-1.ts';

export default makeFrontSquat({
  id: 'barbell-cross-arm-front-squat',
  name: '杠铃交叉抱臂前蹲',
  en: 'Barbell Cross-Arm Front Squat',
  equipment: ['barbell'],
  sources: ['fe:Front_Barbell_Squat'],
}, { grip: 'cross' }) satisfies import('@/exercise.ts').SideExercise;
