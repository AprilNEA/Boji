// Start supine on a flat bench with both feet flat and palms up beside the torso.
// Flex both elbows to curl the dumbbells, while the upper arms stay vertical and fixed.
import type { SideExercise } from '@/exercise.ts';
import { supineDumbbell } from './_biceps-curl-5.ts';

export default supineDumbbell({
  id: 'dumbbell-supine-biceps-curl', name: '仰卧哑铃弯举', en: 'Dumbbell Supine Biceps Curl',
  equipment: ['dumbbell', 'bench'], sources: ['hz:1661', 'hz:0350'],
}) satisfies SideExercise;
