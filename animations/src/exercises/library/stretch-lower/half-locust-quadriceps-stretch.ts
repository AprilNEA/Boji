// Start prone with one knee bent and the same-side hand reaching back to the foot.
// The chest and working foot lift gently while the pelvis remains low and the other leg stays long.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, proneQuad } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'half-locust-quadriceps-stretch', name: '半蝗虫式股四头肌拉伸',
  meta: libraryMeta('Half Locust Quadriceps Stretch', ['bodyweight'], ['fe:One_Half_Locust']),
  muscles: [{ m: 'quads', side: 'near' }, { m: 'hipFlexor', side: 'near', scale: 0.45 }, { m: 'pecs', scale: 0.3 }],
  pose: (p) => proneQuad(p, 16),
}) satisfies SideExercise;
