// Face down with hands under the shoulders, as the source instructs. The palms press the upper body away from the floor.
// The hands and toes remain planted while the elbows extend and flex.
import type { SideExercise } from '@/exercise.ts';
import pushUp from '@/exercises/push-up.ts';

export default {
  ...pushUp,
  id: 'supine-elbow-reverse-push-up',
  name: '俯卧撑',
  meta: { en: 'Supine Elbow Reverse Push-Up', family: 'horizontal-row', equipment: ['bodyweight'], sources: ['hz:1772'] },
} satisfies SideExercise;
