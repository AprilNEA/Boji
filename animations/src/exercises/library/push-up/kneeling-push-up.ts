// Support the body on the knees and palms with the head, torso and thighs aligned.
// Lower the chest near the floor by bending both elbows with the knees remaining down.
// Press through the palms to return to the straight kneeling plank.
import type { SideExercise } from '@/exercise.ts';
import { kneelingPush } from './_push-up-1.ts';

const base = kneelingPush({ id: 'kneeling-push-up', name: '跪姿俯卧撑', en: 'Kneeling Push-Up', sources: ['hz:3211'] });

export default {
  ...base,
  pose(t: number) {
    const pose = base.pose(t);
    return {
      ...pose,
      legs: {
        near: { ...pose.legs.near, a2: 192 },
        far: { ...pose.legs.far, a2: 192 },
      },
    };
  },
} satisfies SideExercise;
