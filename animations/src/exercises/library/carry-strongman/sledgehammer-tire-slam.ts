// Start over the tire in a staggered stance with two hands spaced along the sledge handle.
// Raise the hammer, then hinge and strike the tire while the upper hand slides toward the lower hand.
// The tire stays on the floor and the staggered feet remain planted throughout the slam.
import type { SideExercise } from '@/exercise.ts';
import { sledgehammerSlam } from './_carry-strongman.ts';

export default sledgehammerSlam({
  id: 'sledgehammer-tire-slam', name: '大锤砸轮胎', en: 'Sledgehammer Tire Slam',
  equipment: ['other'], sources: ['fe:Sledgehammer_Swings'],
  muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.65 }, { m: 'forearms', side: 'both', scale: 0.55 }, { m: 'lats', scale: 0.35 }],
}, true) satisfies SideExercise;
