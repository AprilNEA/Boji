// Lie secured on a decline bench with band handles held beside the collarbones.
// The arms stay still while the torso rises to perpendicular, then returns under the band load.
import type { SideExercise } from '@/exercise.ts';
import { declineCore } from './_core-flexion-1.ts';

export default declineCore({
  id: 'band-decline-sit-up', name: '弹力带下斜仰卧起坐',
  meta: { en: 'Band Decline Sit-Up', family: 'core-flexion', equipment: ['band', 'bench'], sources: ['fe:Weighted_Sit-Ups_-_With_Bands'] },
  muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.4 }],
}, { kind: 'situp', band: true }) satisfies SideExercise;
