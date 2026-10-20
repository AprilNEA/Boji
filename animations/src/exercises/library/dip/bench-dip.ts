// Bench dip, side view. Hands grip the rear bench beside the hips and heels stay on the floor.
// The elbows bend to about 90° as the torso stays close to the bench, then extend without shifting the hands.
import type { SideExercise } from '@/exercise.ts';
import { benchDip } from './_dip.ts';

export default benchDip({
  id: 'bench-dip', name: '凳上反向臂屈伸', en: 'Bench Dip', equipment: ['bench'],
  sources: ['fe:Bench_Dips', 'hz:1399', 'hz:3287', 'hz:0814', 'hz:0129', 'hz:0812', 'hz:0813', 'hz:1753', 'hz:0815', 'hz:1754'],
}) satisfies SideExercise;
