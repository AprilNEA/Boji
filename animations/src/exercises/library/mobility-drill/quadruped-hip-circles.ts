// The torso, both hands and the far kneeling leg stay stable in four-point support.
// The near, bent knee rises through a slow large hip arc and then returns to the start.
// The lower leg follows only after the knee clears the mat; knee flexion stays 33–92°.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { keyframes, smooth, timeline } from '@/math/timeline.ts';
import { QUAD, plantedArm } from '@/exercises/common.ts';

const tl = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.25, 0.95] },
  { d: 0.22, from: 1, to: 1, e: [0.95, 0.8] },
  { d: 1.25, from: 1, to: 0, e: [0.8, 0.25] },
  { d: 0.35, from: 0, to: 0, e: [0.25, 0.2] },
]);
// Keep the shin behind the low knee, then let it follow as the thigh has enough clearance.
const shinAngle = keyframes([[0, 178], [0.55, 174], [1, 78]]);

export default {
  id: 'quadruped-hip-circles',
  name: '四点支撑髋关节绕环',
  tl,
  mat: true,
  meta: { en: 'Quadruped Hip Circles', family: 'mobility-drill', equipment: ['bodyweight'], sources: ['fe:Hip_Circles_prone'] },
  muscles: [{ m: 'abductors', side: 'near' }, { m: 'adductors', side: 'near', scale: 0.45 }],
  pose(t) {
    const q = smooth(tl.at(t).p);
    return {
      hip: QUAD.hip,
      spine: QUAD.spine,
      neck: -12,
      head: -10,
      farHip: 0,
      farShoulder: 0,
      legs: {
        near: { a1: lerp(90, -24, q), a2: shinAngle(q), foot: 0 },
        far: { a1: 90, a2: 178, foot: 180 },
      },
      arms: { near: plantedArm(QUAD.wrist), far: plantedArm(QUAD.wristFar) },
    };
  },
} satisfies SideExercise;
