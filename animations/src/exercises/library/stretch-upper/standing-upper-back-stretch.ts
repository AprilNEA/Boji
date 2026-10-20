// Stand tall and interlace the fingers in front of the chest. Press the palms forward and separate the shoulder blades.
// The stretch eases into a long hold, returns to neutral, and repeats without changing the planted stance.
import type { SideExercise } from '@/exercise.ts';
import { sideUpper } from './_stretch-upper.ts';

export default sideUpper({
  id: 'standing-upper-back-stretch', name: '站姿上背部拉伸', en: 'Standing Upper Back Stretch', equipment: ['bodyweight'], sources: ['hz:1405'],
}, 'upper-back', [{ m: 'upperBack' }, { m: 'delts', side: 'both', scale: 0.35 }]) satisfies SideExercise;
