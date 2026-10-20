// Stand facing the high pulley with both elbows tucked beside the torso.
// Keep the upper arms fixed while the reverse-grip bar travels from chest level to the thighs.
import type { SideExercise } from '@/exercise.ts';
import { cablePushdown } from './_triceps-extension-2.ts';

export default cablePushdown({
  id: 'cable-reverse-grip-triceps-pushdown', name: '绳索反握肱三头肌下压', attachment: 'bar',
  meta: { en: 'Cable Reverse-Grip Triceps Pushdown', family: 'triceps-extension', equipment: ['cable'], sources: ['fe:Reverse_Grip_Triceps_Pushdown', 'hz:0207'] },
}) satisfies SideExercise;
