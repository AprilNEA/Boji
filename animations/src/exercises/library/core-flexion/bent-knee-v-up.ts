// Lie on the mat with bent knees, feet planted and hands light behind the head.
// Curl the trunk to 45 degrees while lifting the bent knees toward the chest, then lower together.
import type { SideExercise } from '@/exercise.ts';
import { floorVUp } from './_core-flexion-1.ts';
export default floorVUp({ id: 'bent-knee-v-up', name: '屈膝两头起', meta: { en: 'Bent-Knee V-Up', family: 'core-flexion', equipment: ['bodyweight', 'mat'], sources: ['hz:0456'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }] }, { bent: true }) satisfies SideExercise;
