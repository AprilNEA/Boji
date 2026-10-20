// Sit with the back against the pad and feet close together on the leg-press platform.
// Bend both knees to the narrow start position, then press through the heels to nearly straight legs without locking them.
import type { SideExercise } from '@/exercise.ts';
import { seatedLegPress } from './_squat-3.ts';

export default seatedLegPress({
  id: 'machine-narrow-stance-leg-press', name: '器械窄距腿举', en: 'Machine Narrow-Stance Leg Press',
  sources: ['fe:Narrow_Stance_Leg_Press'], delta: -8, farDx: -1,
}) satisfies SideExercise;
