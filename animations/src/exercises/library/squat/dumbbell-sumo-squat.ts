// Dumbbell sumo squat, side view. Both hands hold one dumbbell low between a wide, turned-out stance.
// The arms stay quiet as the knees and hips descend to parallel, then the heels drive the body upright.
import type { SideExercise } from '@/exercise.ts';
import { gobletDumbbell } from '@/exercises/equipment/index.ts';
import { lowCentralArms, squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.35);
export default {
  id: 'dumbbell-sumo-squat', name: '哑铃相扑深蹲', tl,
  meta: { en: 'Dumbbell Sumo Squat', family: 'squat', equipment: ['dumbbell'], sources: ['fe:Plie_Dumbbell_Squat'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.4 }, { m: 'adductors', scale: 0.4 }, { m: 'abs', scale: 0.25 }],
  dynamic: [gobletDumbbell()],
  pose: (t) => squatPose(tl.at(t).p, lowCentralArms(), { farDx: -10, back: 80, bottom: 100, lean: 36 }),
} satisfies SideExercise;
