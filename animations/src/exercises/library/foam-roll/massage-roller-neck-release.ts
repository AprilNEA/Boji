// Sit upright and hold the massage roller behind the head beside the cervical midline.
// Keep the roller on the neck muscles rather than pressing directly on the spine.
// Move slowly from the upper neck toward its base and pause on tight tissue.
import type { SideExercise } from '@/exercise.ts';
import { neckMassage } from './_foam-roll.ts';

export default neckMassage({
  id: 'massage-roller-neck-release', name: '按摩滚棒颈部放松', en: 'Massage Roller Neck Release', sources: ['fe:Neck-SMR'],
}) satisfies SideExercise;
