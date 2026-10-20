// Start in a high plank, complete one controlled push-up, then return to straight arms.
// Drive one knee under the chest at a time while both hands remain planted and the trunk stays braced.
import type { SideExercise } from '@/exercise.ts';
import { pushToClimber } from './_push-up-2.ts';

export default pushToClimber({
  id: 'push-up-to-mountain-climber', name: '俯卧撑接登山跑', en: 'Push-Up to Mountain Climber',
  equipment: ['bodyweight'], sources: ['hz:3638'],
}) satisfies SideExercise;
