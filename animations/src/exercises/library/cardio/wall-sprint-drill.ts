// Wall sprint drill, side view. The body leans about 45° into the wall with locked, straight supporting arms.
// One knee drives up, then attacks down as the opposite knee rises; the hands and torso stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { cardioTL, wallProps, wallRunPose } from './_cardio-1.ts';

export default {
  id: 'wall-sprint-drill',
  name: '扶墙加速跑练习',
  tl: cardioTL(0.62),
  poster: 0.25,
  meta: { en: 'Wall Sprint Drill', family: 'cardio', equipment: ['bodyweight', 'wall'], sources: ['fe:Linear_Acceleration_Wall_Drill'] },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'quads', side: 'both', scale: 0.7 }, { m: 'calves', side: 'both', scale: 0.55 }, { m: 'glutes', scale: 0.5 }],
  props: wallProps,
  propsBox: [180, 455],
  pose: (t) => wallRunPose(t, { high: 92 }),
} satisfies SideExercise;
