// Barbell Zercher squat, side view. The bar crosses the elbow creases, and the clasped arms keep it close to the torso.
// The chest remains lifted as the hips lower to parallel; the athlete stands by pressing evenly through both heels.
import type { SideExercise } from '@/exercise.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { squatPose, squatTL, zercherArms, zercherBarAt } from './_squat-2.ts';

const tl = squatTL(0.35);
export default {
  id: 'barbell-zercher-squat', name: '杠铃泽奇深蹲', tl,
  meta: { en: 'Barbell Zercher Squat', family: 'squat', equipment: ['barbell'], sources: ['fe:Zercher_Squats', 'hz:0127'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.65 }, { m: 'hamstrings', side: 'both', scale: 0.4 }, { m: 'abs', scale: 0.4 }, { m: 'forearms', side: 'both', scale: 0.25 }],
  dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: zercherBarAt(J) }) })],
  pose: (t) => squatPose(tl.at(t).p, zercherArms(), { farDx: -6, back: 62, bottom: 100, lean: 27 }),
} satisfies SideExercise;
