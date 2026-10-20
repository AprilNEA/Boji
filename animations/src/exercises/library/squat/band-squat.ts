// Loop the band immediately above both knees with the feet shoulder-width apart.
// Lower with the knees tracking outward over the turned-out toes.
// Keep both soles planted and stand by extending the knees and hips.
import { makeBandSquat } from './_squat-1.ts';

export default makeBandSquat({
  id: 'band-squat',
  name: '弹力带深蹲',
  en: 'Band Squat',
  equipment: ['band'],
  sources: ['hz:1004', 'fe:Squats_-_With_Bands'],
}) satisfies import('@/exercise.ts').FrontExercise;
