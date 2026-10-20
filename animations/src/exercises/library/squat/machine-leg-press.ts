// Sit with the torso and pelvis supported, hands on the side handles, and feet shoulder-width on the platform.
// Lower until the knees reach about 90 degrees, then press the platform away through the heels without locking the knees.
import type { SideExercise } from '@/exercise.ts';
import { seatedLegPress } from './_squat-3.ts';

export default seatedLegPress({
  id: 'machine-leg-press', name: '器械腿举', en: 'Machine Leg Press',
  sources: ['fe:Leg_Press'], delta: -8,
}) satisfies SideExercise;
