// Hinge forward with both upper arms fixed alongside the torso and cable handles in hand.
// Extend both elbows backward together, then return to the bent-elbow start.
import type { SideExercise } from '@/exercise.ts';
import { cableKickback } from './_triceps-extension-2.ts';

export default cableKickback({
  id: 'cable-two-arm-triceps-kickback', name: '绳索双臂俯身肱三头肌后伸',
  meta: { en: 'Cable Two-Arm Triceps Kickback', family: 'triceps-extension', equipment: ['cable'], sources: ['hz:1728'] },
}) satisfies SideExercise;
