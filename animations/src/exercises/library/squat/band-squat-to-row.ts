// Face a waist-height anchor with the band held in extended arms.
// Lower into a planted-foot squat, then row the handles to the torso before standing.
// The anchor remains fixed while the band follows both hands.
import { makeBandRowSquat } from './_squat-1.ts';

export default makeBandRowSquat({
  id: 'band-squat-to-row',
  name: '弹力带深蹲划船',
  en: 'Band Squat to Row',
  equipment: ['band'],
  sources: ['hz:1003'],
}) satisfies import('@/exercise.ts').SideExercise;
