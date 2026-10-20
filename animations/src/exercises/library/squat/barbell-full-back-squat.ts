// Place the bar across the upper back with a shoulder-width stance and grounded heels.
// Sit back and down until the hamstrings approach the calves while maintaining a braced torso.
// Extend the knees and hips together to return to a tall lockout.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-full-back-squat',
  name: '杠铃全幅背蹲',
  en: 'Barbell Full Back Squat',
  equipment: ['barbell'],
  sources: ['fe:Barbell_Full_Squat', 'hz:0043', 'hz:1461', 'hz:1462'],
}, { depth: 'deep' }) satisfies import('@/exercise.ts').SideExercise;
