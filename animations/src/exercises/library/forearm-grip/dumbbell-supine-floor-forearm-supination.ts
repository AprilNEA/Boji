// Lie supine on the floor with both arms beside the torso and straight legs on the mat.
// Curl from a straight elbow to 45°, then lower under control while each upper arm stays by the torso.
import type { SideExercise } from '@/exercise.ts';
import { supineFloorForearmCurl } from './_forearm-grip-1.ts';

export default supineFloorForearmCurl({
  id: 'dumbbell-supine-floor-forearm-supination', name: '哑铃地板仰卧前臂旋后', en: 'Dumbbell Supine Floor Forearm Supination',
  sources: ['hz:2706'],
}) satisfies SideExercise;
