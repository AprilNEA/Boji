// Stand with feet shoulder-width apart and both arms straight forward at shoulder height around the roller.
// Alternate the wrists to wind the weighted rope upward, then reverse the roll to lower the weight under control.
import type { SideExercise } from '@/exercise.ts';
import { wristRoller } from './_forearm-grip-2.ts';

export default wristRoller({
  id: 'wrist-roller', name: '卷腕器卷腕', en: 'Wrist Roller', sources: ['fe:Wrist_Roller', 'hz:0859'],
}) satisfies SideExercise;
