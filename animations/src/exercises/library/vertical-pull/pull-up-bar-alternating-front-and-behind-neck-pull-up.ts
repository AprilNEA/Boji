// Use a wide overhand grip and alternate a chest-to-bar pull with a behind-neck pull.
// The front repetition keeps the chest proud; the rear repetition moves the head forward to clear the bar.
import type { SideExercise } from '@/exercise.ts';
import { alternatingPullUp } from './_vertical-pull-2.ts';

export default alternatingPullUp({
  id: 'pull-up-bar-alternating-front-and-behind-neck-pull-up', name: '交替颈前颈后引体',
  en: 'Pull-Up Bar Alternating Front and Behind-Neck Pull-Up', equipment: ['pull-up-bar'],
  sources: ['fe:Rocky_Pull-Ups_Pulldowns'],
}) satisfies SideExercise;
