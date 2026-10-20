// Lie on the mat with bent knees, planted feet and both arms straight toward the ceiling.
// Keep the hands overhead against the band while the trunk curls only to about 45 degrees, then lowers.
import type { SideExercise } from '@/exercise.ts';
import { bandPushSitUp } from './_core-flexion-1.ts';

export default bandPushSitUp({
  id: 'band-push-sit-up', name: '弹力带推举仰卧起坐',
  meta: { en: 'Band Push Sit-Up', family: 'core-flexion', equipment: ['band', 'mat'], sources: ['hz:0992'] },
  muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.35 }, { m: 'pecs', scale: 0.3 }],
}) satisfies SideExercise;
