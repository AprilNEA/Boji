// Lie flat with straight legs together and hold the resistance band in both extended arms overhead.
// Lift the legs and torso together until the hands meet the toes, pause, then return under control.
import type { SideExercise } from '@/exercise.ts';
import { floorVUp } from './_core-flexion-1.ts';

export default floorVUp({
  id: 'band-v-up', name: '弹力带两头起',
  meta: { en: 'Band V-Up', family: 'core-flexion', equipment: ['band', 'mat'], sources: ['hz:1014'] },
  muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }],
}, { band: true }) satisfies SideExercise;
