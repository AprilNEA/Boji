// Starts on a decline bench with the ankles under the rollers and the cable handle(s) at chest height.
// The elbows extend away from the chest while the bench contact and lower body remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'cable-decline-bench-press', name: '绳索下斜卧推', en: 'Cable Decline Bench Press',
  sources: ['hz:1261'],
  support: 'decline', implement: 'cable',
  cableHeight: 'mid',
}) satisfies SideExercise;
