// Start seated with the chest at the preacher support and both upper arms on the pad.
// Curl the neutral-grip machine handles to the shoulders, while the chest and upper arms stay supported.
import type { SideExercise } from '@/exercise.ts';
import { machineCurl } from './_biceps-curl-5.ts';

export default machineCurl({
  id: 'machine-hammer-preacher-curl', name: '器械锤式牧师凳弯举', en: 'Machine Hammer Preacher Curl',
  equipment: ['machine'], sources: ['hz:1615'],
}, { kind: 'preacher', hammer: true }) satisfies SideExercise;
