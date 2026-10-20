// Start folded from the hips with the band under the feet and behind the neck.
// The knees stay soft while the hips extend to a tall, neutral-spine finish.
// The feet remain planted and the band stays in contact with the rear shoulder area.
import type { SideExercise } from '@/exercise.ts';
import { goodMorning } from './_hinge-1.ts';

export default goodMorning({
  id: 'band-good-morning', name: '弹力带早安式', en: 'Band Good Morning',
  sources: ['fe:Band_Good_Morning'], band: 'under-feet', startTall: true,
}) satisfies SideExercise;
