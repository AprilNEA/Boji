// Loop chains over the bar sleeves and keep several links on the floor at lockout.
// Sit back with the loaded bar across the upper back, then stand through the heels.
// The hanging chains shorten and collect on the floor during the descent.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-chain-back-squat',
  name: '杠铃铁链背蹲',
  en: 'Barbell Chain Back Squat',
  equipment: ['barbell', 'other'],
  sources: ['fe:Squat_with_Chains'],
}, { chain: true, wide: true }) satisfies import('@/exercise.ts').SideExercise;
