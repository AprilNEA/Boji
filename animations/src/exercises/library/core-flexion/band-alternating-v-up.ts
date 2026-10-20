// Lie flat with straight legs and hold the band overhead at the start.
// Curl the torso and lift both legs toward the hands. The legs cross subtly at the top, then uncross on descent.
import type { SideExercise } from '@/exercise.ts';
import { floorVUp } from './_core-flexion-1.ts';

export default floorVUp({
  id: 'band-alternating-v-up', name: '弹力带交替两头起',
  meta: { en: 'Band Alternating V-Up', family: 'core-flexion', equipment: ['band', 'mat'], sources: ['hz:0969'] },
  muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }],
}, { band: true, alternating: true }) satisfies SideExercise;
