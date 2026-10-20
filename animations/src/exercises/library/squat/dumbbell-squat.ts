// Dumbbell squat, side view. A dumbbell hangs in each hand beside the legs in a neutral grip throughout the squat.
// The knees and hips bend to parallel while the chest stays proud, then both heels drive the return.
import type { SideExercise } from '@/exercise.ts';
import { dumbbell } from '@/exercises/equipment/index.ts';
import { hangingArms, squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.3);
export default {
  id: 'dumbbell-squat', name: '哑铃深蹲', tl,
  meta: { en: 'Dumbbell Squat', family: 'squat', equipment: ['dumbbell'], sources: ['fe:Dumbbell_Squat', 'hz:0413', 'hz:2803'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.65 }, { m: 'hamstrings', side: 'both', scale: 0.4 }, { m: 'calves', side: 'both', scale: 0.25 }, { m: 'lowerBack', scale: 0.25 }],
  dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')],
  pose: (t) => squatPose(tl.at(t).p, hangingArms(), { farDx: -6, back: 76, bottom: 104, lean: 37 }),
} satisfies SideExercise;
