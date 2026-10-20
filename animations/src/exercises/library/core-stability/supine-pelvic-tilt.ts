// Lie on the back with bent knees and both feet flat on the mat.
// Gently posteriorly tilt the pelvis to press the lower back down without bridging.
// The hips stay on the mat while the abdomen contracts, then the pelvis returns to neutral.
import type { SideExercise } from '@/exercise.ts';
import { workTL } from '@/exercises/equipment/index.ts';
import { pelvicTiltPose } from './_core-stability-2.ts';

const tl = workTL(0.7);

export default {
  id: 'supine-pelvic-tilt',
  name: '仰卧骨盆后倾',
  tl,
  mat: true,
  meta: { en: 'Supine Pelvic Tilt', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3147'] },
  muscles: [{ m: 'abs' }, { m: 'lowerBack', scale: 0.35 }],
  poster: 0.33,
  pose: (t) => pelvicTiltPose(tl.at(t).p),
} satisfies SideExercise;
