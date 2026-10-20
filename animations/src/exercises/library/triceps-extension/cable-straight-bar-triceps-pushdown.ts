// Stand facing the high pulley with an overhand straight-bar grip and elbows tucked.
// Keep the upper arms still while pressing the bar to full elbow extension.
import type { SideExercise } from '@/exercise.ts';
import { cablePushdown } from './_triceps-extension-2.ts';

export default cablePushdown({
  id: 'cable-straight-bar-triceps-pushdown', name: '绳索直杆肱三头肌下压', attachment: 'bar',
  meta: { en: 'Cable Straight-Bar Triceps Pushdown', family: 'triceps-extension', equipment: ['cable'], sources: ['hz:0201'] },
}) satisfies SideExercise;
