// Starts on a decline bench with the ankles under the rollers and the cable handle(s) at chest height.
// The elbows extend away from the chest while the bench contact and lower body remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'cable-decline-single-arm-chest-press', name: '绳索下斜单臂卧推', en: 'Cable Decline Single-Arm Chest Press',
  sources: ['hz:1260'],
  support: 'decline', implement: 'cable',
  single: true,
  cableHeight: 'mid',
}) satisfies SideExercise;
