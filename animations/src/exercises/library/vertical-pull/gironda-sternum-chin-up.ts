// Begin with an underhand grip, chest lifted, lower back arched, and the torso leaning back.
// Keep that arch while pulling the lower chest toward the bar and letting the legs angle forward.
import type { SideExercise } from '@/exercise.ts';
import { girondaChin } from './_vertical-pull-2.ts';

export default girondaChin({
  id: 'gironda-sternum-chin-up', name: '吉隆达胸骨引体', en: 'Gironda Sternum Chin-Up', equipment: ['pull-up-bar'],
  sources: ['fe:Gironda_Sternum_Chins', 'hz:0466'],
}) satisfies SideExercise;
