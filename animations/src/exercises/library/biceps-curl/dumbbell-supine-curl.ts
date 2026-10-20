// Start supine on a flat bench with the dumbbells hanging beside the torso in a neutral grip.
// Curl both weights toward the shoulders and rotate the wrists, without moving the upper arms or feet.
import type { SideExercise } from '@/exercise.ts';
import { supineDumbbell } from './_biceps-curl-5.ts';

export default supineDumbbell({
  id: 'dumbbell-supine-curl', name: '仰卧哑铃弯举', en: 'Dumbbell Supine Curl',
  equipment: ['dumbbell', 'bench'], sources: ['fe:Lying_Supine_Dumbbell_Curl'],
}, { profile: true }) satisfies SideExercise;
