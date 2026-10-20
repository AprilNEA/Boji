// Bodyweight partial squat, side view. The hips sit back only partway and stop well above a parallel thigh position.
// The chest stays lifted over planted heels before the legs reverse smoothly to an upright stance.
import type { SideExercise } from '@/exercise.ts';
import { hangingArms, squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.15);
export default {
  id: 'bodyweight-partial-squat', name: '徒手半蹲', tl,
  meta: { en: 'Bodyweight Partial Squat', family: 'squat', equipment: ['bodyweight'], sources: ['hz:3221', 'fe:Sit_Squats'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.5 }, { m: 'hamstrings', side: 'both', scale: 0.3 }],
  pose: (t) => squatPose(tl.at(t).p, hangingArms(), { farDx: -6, back: 42, bottom: 142, lean: 22 }),
} satisfies SideExercise;
