// Stand at the high pulley with an arm blaster supporting the upper arms at the elbows.
// Keep both upper arms on the support while extending and flexing only the elbows.
import type { SideExercise } from '@/exercise.ts';
import { cablePushdown } from './_triceps-extension-2.ts';

export default cablePushdown({
  id: 'cable-v-bar-triceps-pushdown-with-arm-blaster', name: '绳索臂托V形把肱三头肌下压', attachment: 'vbar', armBlaster: true,
  meta: { en: 'Cable V-Bar Triceps Pushdown with Arm Blaster', family: 'triceps-extension', equipment: ['cable', 'other'], sources: ['hz:2405'] },
}) satisfies SideExercise;
