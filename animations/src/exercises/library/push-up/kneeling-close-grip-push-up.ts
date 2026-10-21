// Use the knees as the lower support and bring the palms close beneath the chest.
// Keep a straight line from the knees through the shoulders as the elbows bend beside the ribs.
// Press through the close palms to return to the kneeling high position.
import type { SideExercise } from '@/exercise.ts';
import { kneelingPush } from './_push-up-1.ts';

const base = kneelingPush({ id: 'kneeling-close-grip-push-up', name: '跪姿窄距俯卧撑', en: 'Kneeling Close-Grip Push-Up', sources: ['hz:2398'] }, true);

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
