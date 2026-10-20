// Dumbbell goblet squat, side view. One vertical dumbbell stays against the chest while both hands cup its upper end.
// The front load permits an upright torso as the hips lower to parallel and rise again through the heels.
import type { SideExercise } from '@/exercise.ts';
import { gobletDumbbell } from '@/exercises/equipment/index.ts';
import { gobletArms, squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.35);
export default {
  id: 'dumbbell-goblet-squat', name: '哑铃高脚杯深蹲', tl,
  meta: { en: 'Dumbbell Goblet Squat', family: 'squat', equipment: ['dumbbell'], sources: ['hz:1760'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.6 }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'calves', side: 'both', scale: 0.25 }, { m: 'abs', scale: 0.25 }],
  dynamic: [gobletDumbbell()],
  pose: (t) => squatPose(tl.at(t).p, gobletArms(), { farDx: -6, back: 64, bottom: 98, lean: 26 }),
} satisfies SideExercise;
