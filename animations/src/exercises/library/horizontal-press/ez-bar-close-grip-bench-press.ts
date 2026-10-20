// Lying flat with feet planted, the close grip keeps both elbows near the torso.
// The EZ bar moves from the lower chest to a straight-arm position above the torso.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'ez-bar-close-grip-bench-press',
  name: '曲杆窄握卧推',
  en: 'EZ-Bar Close-Grip Bench Press',
  equipment: ['ez-bar', 'bench'],
  sources: ['fe:Close-Grip_EZ-Bar_Press', 'hz:2432'],
  kind: 'ez-bar-bench',
}) satisfies SideExercise;
