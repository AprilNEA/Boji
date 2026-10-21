// Begin in a low plank with elbows near 90 degrees, hands and one toe fixed to the mat.
// Each leg externally rotates and brings its knee toward the same-side elbow before returning.
import type { SideExercise } from '@/exercise.ts';
import { lerp, lerpV } from '@/math/vec2.ts';
import { breath, bump } from '@/math/timeline.ts';
import { solve, type LimbSpec, type Pose } from '@/rig/side.ts';
import { HIGH_PLANK, plantedArm } from '@/exercises/common.ts';

// The knee reaches forward at about 30° while the ankle folds back below the abdomen.
// The hips lift only as the thigh crosses its floor-facing branch, so that knee never enters the mat.
const SPIDER_BODY = HIGH_PLANK.body(-12);
const SPIDER_CLEARANCE_HIP = HIGH_PLANK.body(-25).hip;
const SPIDER_ARMS = { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) };
const KNEE_DRIVE_ANGLE = 28;
const SPIDER_REST = (() => {
  const J = solve({ ...SPIDER_BODY, arms: SPIDER_ARMS });
  return {
    near: { a1: J.thigh_n.a, a2: J.shin_n.a, foot: J.foot_n.a },
    far: { a1: J.thigh_f.a, a2: J.shin_f.a, foot: J.foot_f.a },
  };
})();

function drivingLeg(side: 'near' | 'far', q: number): LimbSpec {
  const rest = SPIDER_REST[side];
  const offset = side === 'far' ? 2 : 0;
  return {
    a1: lerp(rest.a1, KNEE_DRIVE_ANGLE + offset, q),
    a2: lerp(rest.a2, 180 + offset, q),
    foot: lerp(rest.foot, 180 + offset, q),
  };
}

function spiderPose(t: number): Pose {
  const nearTurn = t < 0.5;
  const q = breath((t % 0.5) * 2);
  const clearance = bump(q);
  const torso = lerp(-12, -8, clearance);
  return {
    ...SPIDER_BODY, hip: lerpV(SPIDER_BODY.hip, SPIDER_CLEARANCE_HIP, clearance),
    spine: { lumbar: torso, thoracic: torso - 1 }, neck: torso - 4, head: torso + 2,
    legs: nearTurn
      ? { near: drivingLeg('near', q), far: SPIDER_BODY.legs.far }
      : { near: SPIDER_BODY.legs.near, far: drivingLeg('far', q) },
    arms: SPIDER_ARMS,
  };
}

export default {
  id: 'bodyweight-spider-plank-knee-drive',
  name: '蜘蛛式平板提膝',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Bodyweight Spider Plank Knee Drive', family: 'core-stability', equipment: ['bodyweight'], sources: ['fe:Spider_Crawl'] },
  muscles: [
    { m: 'abs', e: () => 0.9 }, { m: 'pecs', scale: 0.45, e: () => 0.62 },
    { m: 'delts', side: 'both', scale: 0.45, e: () => 0.55 }, { m: 'triceps', side: 'both', scale: 0.4, e: () => 0.52 },
  ],
  poster: 0.125,
  pose: spiderPose,
} satisfies SideExercise;
