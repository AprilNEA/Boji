// Lower from a full high plank until the chest is close to the mat.
// Place both knees down before pressing through the hands toward the start position.
// Keep the elbows near the torso during the descent and the kneeling press.
import type { SideExercise } from '@/exercise.ts';
import { kneeDropPush } from './_push-up-1.ts';

const base = kneeDropPush({ id: 'knee-drop-push-up', name: '落膝俯卧撑', en: 'Knee-Drop Push-Up', sources: ['hz:1275'] });

export default {
  ...base,
  pose(t: number) {
    const pose = base.pose(t);
    if (pose.legs.near.a2 === undefined) return pose;
    return {
      ...pose,
      legs: {
        near: { ...pose.legs.near, a2: 192 },
        far: { ...pose.legs.far, a2: 192 },
      },
    };
  },
} satisfies SideExercise;
