// Single-arm kettlebell overhead squat, side view. The near arm stays locked overhead with one bell while the other hangs.
// The chest remains up through the squat, the feet stay flat, and the loaded elbow never bends.
import type { SideExercise } from '@/exercise.ts';
import { add, mul } from '@/math.ts';
import { gripAt, kettlebell } from '@/exercises/equipment/index.ts';
import { ARM_STRAIGHT } from '@/exercises/common.ts';
import { squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.55);
export default {
  id: 'kettlebell-single-arm-overhead-squat', name: '壶铃单臂过顶深蹲', tl,
  meta: { en: 'Kettlebell Single-Arm Overhead Squat', family: 'squat', equipment: ['kettlebell'], sources: ['fe:One-Arm_Overhead_Kettlebell_Squats'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.55 }, { m: 'delts', side: 'near', scale: 0.55 }, { m: 'triceps', side: 'near', scale: 0.35 }, { m: 'calves', side: 'both', scale: 0.25 }],
  dynamic: [kettlebell((J) => ({ p: gripAt(J) }), 'face')],
  pose: (t) => squatPose(tl.at(t).p, {
    near: { target: (J) => add(J.S, [0, -ARM_STRAIGHT]), side: [-1, 0], hand: -90 },
    far: { a1: 95, a2: 88, hand: 88 },
  }, { farDx: -6, back: 64, bottom: 98, lean: 26 }),
} satisfies SideExercise;
