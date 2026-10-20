// Stand facing away from a waist-height anchor with stable feet and the band held at the chest.
// Keep the elbows near the ribs and flex through the spine toward the knees, then stand tall again.
import type { SideExercise } from '@/exercise.ts';
import { standingBandCrunch } from './_core-flexion-1.ts';

export default standingBandCrunch({
  id: 'band-standing-crunch', name: '弹力带站姿卷腹',
  meta: { en: 'Band Standing Crunch', family: 'core-flexion', equipment: ['band'], sources: ['hz:1005'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.45 }],
}) satisfies SideExercise;
