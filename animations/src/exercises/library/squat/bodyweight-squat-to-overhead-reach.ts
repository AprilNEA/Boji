// Squat to overhead reach, side view. The arms lower during the squat and sweep upward as the legs stand.
// Both heels remain down while the torso stays long; the finish has straight elbows and a clear vertical reach.
import type { SideExercise } from '@/exercise.ts';
import { reachArms, squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.2);
export default {
  id: 'bodyweight-squat-to-overhead-reach', name: '徒手深蹲接上举', tl,
  meta: { en: 'Bodyweight Squat to Overhead Reach', family: 'squat', equipment: ['bodyweight'], sources: ['hz:1685'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.35 }, { m: 'abs', scale: 0.25 }],
  pose: (t) => { const p = tl.at(t).p; return squatPose(p, reachArms(p), { farDx: -6, back: 68, bottom: 103, lean: 32 }); },
} satisfies SideExercise;
