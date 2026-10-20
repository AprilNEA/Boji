// Stand tall with soft knees and bring open palms together at the centre of the chest.
// Keep each elbow near 88° while the pressed palms remain at chest height.
// Both feet and the hand contact point stay fixed during the isometric contraction.
import type { FrontExercise } from '@/exercise.ts';
import { makeChestSqueeze } from './_chest-fly-1.ts';

export default makeChestSqueeze(
  'isometric-chest-squeeze', '胸部等长对掌挤压', 'Isometric Chest Squeeze', ['fe:Isometric_Chest_Squeezes', 'hz:1297'],
) satisfies FrontExercise;
