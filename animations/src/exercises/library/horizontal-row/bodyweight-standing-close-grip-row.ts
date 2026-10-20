// Leaning back from a fixed waist-high handle with a close grip. Both hands pull the torso forward.
// The feet and support stay fixed during the row.
import type { SideExercise } from '@/exercise.ts';
import { standingBodyRow } from './_horizontal-row-1.ts';

export default standingBodyRow({
  id: 'bodyweight-standing-close-grip-row',
  name: '自重站姿窄握划船',
  meta: { en: 'Bodyweight Standing Close-Grip Row', family: 'horizontal-row', equipment: ['bodyweight', 'pull-up-bar'], sources: ['hz:3158'] },
}, {}) satisfies SideExercise;
