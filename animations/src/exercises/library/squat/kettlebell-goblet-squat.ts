// Kettlebell goblet squat, side view. Both hands hold the horns of one bell close to the chest.
// The torso stays upright as the hips sink between the feet, pause low, then return through the heels.
import type { SideExercise } from '@/exercise.ts';
import { gripAt, kettlebell } from '@/exercises/equipment/index.ts';
import { gobletArms, squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.45);
export default {
  id: 'kettlebell-goblet-squat', name: '壶铃高脚杯深蹲', tl,
  meta: { en: 'Kettlebell Goblet Squat', family: 'squat', equipment: ['kettlebell'], sources: ['fe:Goblet_Squat', 'hz:0533', 'hz:0534'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.6 }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'calves', side: 'both', scale: 0.25 }, { m: 'delts', side: 'both', scale: 0.2 }],
  dynamic: [kettlebell((J) => ({ p: gripAt(J) }), 'face')],
  pose: (t) => squatPose(tl.at(t).p, gobletArms(), { farDx: -6, back: 62, bottom: 91, lean: 23 }),
} satisfies SideExercise;
