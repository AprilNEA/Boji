// Wall high knees, side view. Both hands brace the wall while the athlete alternates one knee toward the chest.
// The planted foot stays on the floor and the upper body remains stable against the wall.
import type { SideExercise } from '@/exercise.ts';
import { cardioTL, wallProps, wallRunPose } from './_cardio-1.ts';

export default {
  id: 'wall-high-knees',
  name: '扶墙高抬腿',
  tl: cardioTL(0.72),
  poster: 0.25,
  meta: { en: 'Wall High Knees', family: 'cardio', equipment: ['bodyweight', 'wall'], sources: ['hz:3636'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'hipFlexor', side: 'both', scale: 0.65 }, { m: 'calves', side: 'both', scale: 0.45 }, { m: 'glutes', scale: 0.35 }],
  props: wallProps,
  propsBox: [180, 455],
  pose: (t) => wallRunPose(t, { high: 76, lean: -62, shoulder: [330, 220] }),
} satisfies SideExercise;
