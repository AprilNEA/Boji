// Lie flat with the band in both straight arms behind the head and legs together.
// Raise the straight legs and upper body together until the hands reach the toes, then lower slowly.
import type { SideExercise } from '@/exercise.ts';
import { floorVUp } from './_core-flexion-1.ts';

export default floorVUp({
  id: 'band-jackknife-sit-up', name: '弹力带两头起',
  meta: { en: 'Band Jackknife Sit-Up', family: 'core-flexion', equipment: ['band', 'mat'], sources: ['hz:0981'] },
  muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }],
}, { band: true }) satisfies SideExercise;
