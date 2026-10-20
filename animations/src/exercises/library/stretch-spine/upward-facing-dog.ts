// Begin prone with palms beside the lower ribs and the tops of the feet on the mat.
// Straighten the arms to lift the chest and thighs, keeping the legs long and shoulders rolled back.
import type { SideExercise } from '@/exercise.ts';
import { stretchTL, upwardDogPose } from './_stretch-spine.ts';

export default {
  id: 'upward-facing-dog',
  name: '上犬式',
  tl: stretchTL,
  mat: true,
  meta: { en: 'Upward-Facing Dog', family: 'stretch-spine', equipment: ['bodyweight', 'mat'], sources: ['hz:1366'] },
  muscles: [{ m: 'lowerBack' }, { m: 'triceps', side: 'both', scale: 0.5 }, { m: 'pecs', scale: 0.4 }],
  poster: 0.44,
  pose: (t) => upwardDogPose(stretchTL.at(t).p),
} satisfies SideExercise;
