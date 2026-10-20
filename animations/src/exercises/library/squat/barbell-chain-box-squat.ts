// Use chains on the bar sleeves with a box positioned behind the hips.
// Sit to the box without a bounce, then drive up with the bar tight across the back.
// The chain links settle toward the floor at the lower position.
import { makeBackSquat } from './_squat-1.ts';

export default makeBackSquat({
  id: 'barbell-chain-box-squat',
  name: '杠铃铁链箱式深蹲',
  en: 'Barbell Chain Box Squat',
  equipment: ['barbell', 'other', 'box'],
  sources: ['fe:Box_Squat_with_Chains'],
}, { chain: true, bench: 'box', wide: true }) satisfies import('@/exercise.ts').SideExercise;
