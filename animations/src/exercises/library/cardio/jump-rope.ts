// Hold a handle in each hand with the rope turning from behind the body to overhead.
// Make a soft two-foot hop as the rope passes below the shoes, then land on the balls of the feet.
import type { SideExercise } from '@/exercise.ts';
import { jumpRope } from './_cardio-2.ts';

export default {
  ...jumpRope({ en: 'Jump Rope', sources: ['fe:Rope_Jumping', 'hz:2612'] }, '跳绳'),
  id: 'jump-rope',
} satisfies SideExercise;
