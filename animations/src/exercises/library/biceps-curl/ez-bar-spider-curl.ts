// Start with the chest supported on a preacher pad and both upper arms resting along its upper edge.
// Curl the EZ-bar while the torso and upper arms stay supported, then lower under control.
import type { SideExercise } from '@/exercise.ts';
import { spiderEzBar } from './_biceps-curl-5.ts';

export default spiderEzBar({
  id: 'ez-bar-spider-curl', name: '曲杆蜘蛛弯举', en: 'EZ-Bar Spider Curl',
  equipment: ['ez-bar', 'bench'], sources: ['fe:Spider_Curl', 'hz:0454', 'hz:1628'],
}) satisfies SideExercise;
