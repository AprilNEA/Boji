// Face away from the Smith machine and rest the top of the rear foot on its fixed hip-height bar.
// Bend the front knee to descend with a straight back and a planted front heel.
// Extend the supporting leg to rise without moving the front foot or the rear foot on the bar.
import type { SideExercise } from '@/exercise.ts';
import { smithSprintLunge } from './_lunge-split-2.ts';

const base = smithSprintLunge();

export default {
  ...base,
  pose: (t) => {
    const pose = base.pose(t);
    return {
      ...pose,
      // A straight 16° forward trunk lean accommodates the fixed hip-height rear foot without hip hyperextension.
      spine: { lumbar: -74, thoracic: -75 }, neck: -71, head: -74,
      // The elevated rear knee must fold toward the rear thigh, not forward beneath the hip.
      legs: { ...pose.legs, far: { ...pose.legs.far, side: [-1, 0] } },
    };
  },
} satisfies SideExercise;
