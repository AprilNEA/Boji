// Stand upright and hold a weight plate in front of the waist with the elbows softly locked.
// Lift the plate forward to slightly above shoulder level, pause, then lower without torso swing.
// The hands keep a shared plate grip while the feet and trunk remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { standingFrontRaise } from './_front-raise.ts';

export default standingFrontRaise({
  id: 'weight-plate-front-raise', name: '杠铃片前平举', en: 'Weight Plate Front Raise',
  sources: ['fe:Front_Plate_Raise'], implement: 'plate', top: -6,
}) satisfies SideExercise;
