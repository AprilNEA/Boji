// Start seated with the chest against the support and both upper arms resting on the preacher pad.
// Flex the elbows against the machine handles, while the upper arms stay in contact with the pad.
import type { SideExercise } from '@/exercise.ts';
import { machineCurl } from './_biceps-curl-5.ts';

export default machineCurl({
  id: 'machine-preacher-curl', name: '器械牧师凳弯举', en: 'Machine Preacher Curl',
  equipment: ['machine'], sources: ['fe:Machine_Bicep_Curl', 'fe:Machine_Preacher_Curls', 'hz:0592', 'hz:1614'],
}, { kind: 'preacher' }) satisfies SideExercise;
