// Bodyweight burpee, side view. Stand tall, fold into a low hands-down squat, kick back to a plank and do one push-up.
// Return the feet under the hips, then jump with the arms overhead. Hands, toes and the chest path stay clear of the floor.
import type { SideExercise } from '@/exercise.ts';
import { add, len, lerp, lerpV, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import type { LimbSpec, Pose } from '@/rig/side.ts';
import { G, plantedArm, HIGH_PLANK } from '@/exercises/common.ts';

const tl = timeline([
  { d: 0.32, from: 0, to: 1, e: [0.4, 0.8] },
  { d: 0.25, from: 1, to: 2, e: [0.8, 0.9] },
  { d: 0.28, from: 2, to: 3, e: [0.9, 1] },
  { d: 0.28, from: 3, to: 2, e: [1, 0.85] },
  { d: 0.25, from: 2, to: 1, e: [0.85, 0.75] },
  { d: 0.30, from: 1, to: 4, e: [0.75, 1] },
  { d: 0.32, from: 4, to: 0, e: [1, 0.4] },
]);

type FixedPose = Omit<Pose, 'spine'> & { spine: { lumbar: number; thoracic: number } };

const stand: FixedPose = {
  hip: [244, 255], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, farHip: 0,
  legs: { near: { target: [244, G - 13], side: [1, 0], foot: 0 }, far: { target: [244, G - 13], side: [1, 0], foot: 0 } },
  arms: { near: { target: [269, 270], side: [-1, 0], hand: 90 }, far: { target: [262, 270], side: [-1, 0], hand: 90 } },
};
const fold: FixedPose = {
  hip: [237, 365], spine: { lumbar: -12, thoracic: -15 }, neck: -20, head: -18, farHip: 0,
  legs: { near: { target: [255, G - 13], side: [1, 0], foot: 0 }, far: { target: [246, G - 13], side: [1, 0], foot: 0 } },
  arms: { near: { target: [370, G - 7], side: [-1, 0], hand: 0 }, far: { target: [363, G - 7], side: [-1, 0], hand: 0 } },
};
const plank = (th: number): FixedPose => ({
  ...HIGH_PLANK.body(th),
  arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) },
} as FixedPose);
const jump: FixedPose = {
  hip: [244, 239], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, farHip: 0,
  legs: { near: { target: [244, G - 29], side: [1, 0], foot: 0 }, far: { target: [244, G - 29], side: [1, 0], foot: 0 } },
  arms: { near: { target: [250, 12], side: [-1, 0], hand: -90 }, far: { target: [244, 12], side: [-1, 0], hand: -90 } },
};
const keys = [stand, fold, plank(HIGH_PLANK.top), plank(HIGH_PLANK.bottom), jump];

const target = (x: LimbSpec): Vec2 => x.target as Vec2;
const limb = (a: LimbSpec, b: LimbSpec, u: number): LimbSpec => ({
  target: lerpV(target(a), target(b), u), side: [1, 0],
  foot: lerp(a.foot as number, b.foot as number, u), hand: lerp(a.hand as number, b.hand as number, u),
});
/** While the trunk folds faster than the hands can descend, the wrists follow the reachable edge of their path. */
const arm = (a: LimbSpec, b: LimbSpec, u: number, far: boolean): LimbSpec => {
  const goal = lerpV(target(a), target(b), u);
  return {
    target: (J) => {
      const shoulder = far ? J.Sf : J.S;
      const d = sub(goal, shoulder), distance = len(d);
      return distance > 124 ? add(shoulder, mul(d, 124 / distance)) : goal;
    },
    side: [-1, 0], hand: lerp(a.hand as number, b.hand as number, u),
  };
};
function between(a: FixedPose, b: FixedPose, u: number): Pose {
  return {
    hip: lerpV(a.hip, b.hip, u),
    spine: { lumbar: lerp(a.spine.lumbar, b.spine.lumbar, u), thoracic: lerp(a.spine.thoracic, b.spine.thoracic, u) },
    neck: lerp(a.neck, b.neck, u), head: lerp(a.head, b.head, u), farHip: 0, farShoulder: 0,
    legs: { near: limb(a.legs.near, b.legs.near, u), far: limb(a.legs.far, b.legs.far, u) },
    arms: { near: arm(a.arms.near, b.arms.near, u, false), far: arm(a.arms.far, b.arms.far, u, true) },
  };
}

export default {
  id: 'bodyweight-burpee',
  name: '波比跳',
  tl,
  poster: 0.86,
  meta: { en: 'Bodyweight Burpee', family: 'cardio', equipment: ['bodyweight'], sources: ['hz:1160', 'hz:0501'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'pecs', scale: 0.6 }, { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'calves', side: 'both', scale: 0.45 }],
  pose(t) {
    const x = tl.at(t).p, i = Math.floor(x), u = x - i;
    return between(keys[i]!, keys[Math.min(i + 1, keys.length - 1)]!, u);
  },
} satisfies SideExercise;
