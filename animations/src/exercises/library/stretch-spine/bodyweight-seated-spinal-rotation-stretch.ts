// Sit upright on a chair with the feet planted, fingers interlaced behind the head, and elbows wide.
// Rotate the torso to one side while the pelvis stays on the chair and then return to upright.
import type { FrontExercise } from '@/exercise.ts';
import { frontChairProps, frontChairRotationPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'bodyweight-seated-spinal-rotation-stretch',
  name: '坐姿脊柱旋转拉伸',
  view: 'front',
  tl: stretchTL,
  meta: { en: 'Bodyweight Seated Spinal Rotation Stretch', family: 'stretch-spine', equipment: ['chair'], sources: ['fe:Spinal_Stretch'] },
  muscles: [{ m: 'upperBack', region: { view: 'front', part: 'lats', c: [17, 1], s: [8, 28], r: 5, mirror: true } }, { m: 'obliques', scale: 0.55 }],
  props: frontChairProps,
  propsBox: [-97, 97],
  poster: 0.44,
  pose: (t) => frontChairRotationPose(stretchTL.at(t).p),
} satisfies FrontExercise;
