// Sit on the floor with one long leg and the other bent leg crossed over it.
// Brace one arm against the raised knee and the other hand on the mat while the chest rotates toward the knee.
import type { FrontExercise } from '@/exercise.ts';
import { frontSeatedTwistPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'seated-spinal-twist-stretch',
  name: '坐姿脊柱扭转拉伸',
  view: 'front',
  tl: stretchTL,
  mat: true,
  meta: { en: 'Seated Spinal Twist Stretch', family: 'stretch-spine', equipment: ['bodyweight'], sources: ['fe:Dancers_Stretch'] },
  muscles: [{ m: 'lowerBack', region: { view: 'front', part: 'lats', c: [16, 3], s: [8, 30], r: 6, mirror: true } }, { m: 'obliques', scale: 0.55 }],
  poster: 0.44,
  pose: (t) => frontSeatedTwistPose(stretchTL.at(t).p),
} satisfies FrontExercise;
