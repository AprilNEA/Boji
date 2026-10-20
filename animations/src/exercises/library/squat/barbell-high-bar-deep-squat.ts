// Support the bar high on the traps with a hip-width stance and toes turned out as needed.
// Let the knees travel forward while keeping the torso more upright into full depth.
// Drive upward from the front of the heel without lifting either foot.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-high-bar-deep-squat',
  name: '杠铃高杠深蹲',
  en: 'Barbell High-Bar Deep Squat',
  equipment: ['barbell'],
  sources: ['fe:Olympic_Squat'],
}, { bar: 'high', depth: 'deep' }) satisfies import('@/exercise.ts').SideExercise;
