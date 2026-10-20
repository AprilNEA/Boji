// Lie flat with the band around both foot arches and hold its ends beside the hips.
// Keep both legs long and together as they rise to vertical, then lower without moving the hands.
import type { SideExercise } from '@/exercise.ts';
import { bandLegRaise } from './_core-flexion-1.ts';

export default bandLegRaise({
  id: 'band-lying-straight-leg-raise', name: '弹力带仰卧直腿举腿',
  meta: { en: 'Band Lying Straight-Leg Raise', family: 'core-flexion', equipment: ['band', 'mat'], sources: ['hz:1002'] },
  muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }],
}) satisfies SideExercise;
