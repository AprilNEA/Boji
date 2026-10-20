// Balance the bar on the front shoulders with the arms straight out in front.
// Keep the shoulders forward and torso upright as the knees and hips flex deeply.
// The arms do not grip the bar, and the heels remain grounded.
import { makeFrontSquat } from './_squat-1.ts';

export default makeFrontSquat({
  id: 'barbell-frankenstein-squat',
  name: '杠铃僵尸前蹲',
  en: 'Barbell Frankenstein Squat',
  equipment: ['barbell'],
  sources: ['fe:Frankenstein_Squat', 'hz:3194'],
}, { grip: 'frankenstein', deep: true }) satisfies import('@/exercise.ts').SideExercise;
