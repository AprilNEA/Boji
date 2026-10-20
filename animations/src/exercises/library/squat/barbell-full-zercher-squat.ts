// Cradle the bar in the elbow crooks with both hands holding it for stability.
// Keep the chest lifted while lowering to a deep planted-foot squat.
// Extend the knees and hips together to return to standing.
import { makeFrontSquat } from './_squat-1.ts';

export default makeFrontSquat({
  id: 'barbell-full-zercher-squat',
  name: '杠铃泽奇深蹲',
  en: 'Barbell Full Zercher Squat',
  equipment: ['barbell'],
  sources: ['hz:1545'],
}, { grip: 'zercher', deep: true }) satisfies import('@/exercise.ts').SideExercise;
