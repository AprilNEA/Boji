// Leaning back from fixed handles with arms extended. Both hands pull the torso toward the support.
// The feet and support stay fixed during the row.
import type { SideExercise } from '@/exercise.ts';
import { standingBodyRow } from './_horizontal-row-1.ts';

export default standingBodyRow({
  id: 'bodyweight-standing-row',
  name: '自重站姿划船',
  meta: { en: 'Bodyweight Standing Row', family: 'horizontal-row', equipment: ['bodyweight', 'pull-up-bar'], sources: ['hz:3166'] },
}, {}) satisfies SideExercise;
