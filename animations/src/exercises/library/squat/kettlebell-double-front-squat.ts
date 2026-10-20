// Double-kettlebell front squat, side view. Two bells rest in a shoulder rack with elbows forward and chest high.
// The athlete squats between a planted stance, pauses low, and stands upright through both heels.
import type { SideExercise } from '@/exercise.ts';
import { gripAt, kettlebell } from '@/exercises/equipment/index.ts';
import { frontRackArms, squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.4);
export default {
  id: 'kettlebell-double-front-squat', name: '双壶铃前蹲', tl,
  meta: { en: 'Kettlebell Double Front Squat', family: 'squat', equipment: ['kettlebell'], sources: ['fe:Front_Squats_With_Two_Kettlebells'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.55 }, { m: 'calves', side: 'both', scale: 0.25 }, { m: 'abs', scale: 0.3 }],
  dynamic: [kettlebell((J) => ({ p: gripAt(J, 'f') }), 'edge', 'overFarArm', 'Far Kettlebell'), kettlebell((J) => ({ p: gripAt(J) }), 'face')],
  pose: (t) => squatPose(tl.at(t).p, frontRackArms(), { farDx: -8, back: 58, bottom: 96, lean: 22 }),
} satisfies SideExercise;
