// Stand side-on to a high pulley with the working elbow held beside the ribs.
// Keep that arm fixed and crunch the loaded side of the torso down.
// The free hand stays at the hip and the stack never unloads at rest.
import type { FrontExercise } from '@/exercise.ts';
import { standingSideBend } from './_core-lateral.ts';

const exercise = standingSideBend({
  id: 'cable-single-arm-high-pulley-side-bend', name: '绳索单臂高位体侧屈', en: 'Cable Single-Arm High-Pulley Side Bend', kind: 'cable-high',
  equipment: ['cable'], sources: ['fe:One-Arm_High-Pulley_Cable_Side_Bends'],
});
export default exercise satisfies FrontExercise;
