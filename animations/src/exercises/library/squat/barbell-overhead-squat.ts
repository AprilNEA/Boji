// Barbell overhead squat, side view. A wide-grip bar stays locked over the shoulders through the full squat.
// The feet remain flat, the chest stays proud, and the torso leans only enough to keep the load balanced.
import type { SideExercise } from '@/exercise.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { overheadArms, overheadGrip, squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.3);
export default {
  id: 'barbell-overhead-squat', name: '杠铃过顶深蹲', tl,
  meta: { en: 'Barbell Overhead Squat', family: 'squat', equipment: ['barbell'], sources: ['fe:Overhead_Squat', 'hz:0069'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.55 }, { m: 'triceps', side: 'both', scale: 0.35 }, { m: 'abs', scale: 0.35 }],
  dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: overheadGrip(J) }) })],
  pose: (t) => squatPose(tl.at(t).p, overheadArms(), { farDx: -8, back: 64, bottom: 100, lean: 27 }),
} satisfies SideExercise;
