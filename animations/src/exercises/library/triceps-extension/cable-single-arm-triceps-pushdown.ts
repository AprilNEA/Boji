// Stand at the cable with a soft knee bend and the working elbow fixed at the side.
// Press the single handle down by elbow extension, then return without shoulder movement.
import type { SideExercise } from '@/exercise.ts';
import { cablePushdown } from './_triceps-extension-2.ts';

export default cablePushdown({
  id: 'cable-single-arm-triceps-pushdown', name: '绳索单臂肱三头肌下压', attachment: 'bar', single: true,
  meta: { en: 'Cable Single-Arm Triceps Pushdown', family: 'triceps-extension', equipment: ['cable'], sources: ['hz:1723'] },
}) satisfies SideExercise;
