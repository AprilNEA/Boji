// Lie on a flat bench with both feet planted and grip the chain-loaded handles above the chest.
// The elbows bend to roughly 90 degrees as chain settles on the floor, then extend to lockout.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'chain-bench-press',
  name: '铁链卧推',
  en: 'Chain Bench Press',
  equipment: ['other', 'bench'],
  sources: ['fe:Chain_Press'],
  kind: 'chain-bench',
}) satisfies SideExercise;
