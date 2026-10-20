// Sit astride a stability ball with both feet flat and both arms wrapped around the ball.
// Lower the hips and fold over the ball without letting the feet or the ball move away.
import type { SideExercise } from '@/exercise.ts';
import { ballHugPose, ballProps, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'stability-ball-hug-stretch', name: '健身球抱球拉伸', tl: stretchTL,
  meta: { en: 'Stability Ball Hug Stretch', family: 'stretch-spine', equipment: ['stability-ball'], sources: ['fe:Hug_A_Ball', 'hz:1338'] },
  muscles: [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.5 }, { m: 'abs', scale: 0.35 }],
  props: ballProps([250, 378]), propsBox: [178, 322], poster: 0.44,
  pose: (t) => ballHugPose(stretchTL.at(t).p),
} satisfies SideExercise;
