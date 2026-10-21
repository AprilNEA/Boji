// The feet hook under the decline-bench roller while the bar lowers only by elbow flexion.
// The controlled return retraces the same elbow-only path to make the loop seamless.
import type { SideExercise } from '@/exercise.ts';
import { barbellExtension } from './_triceps-extension-1.ts';

const exercise = barbellExtension({ id: 'barbell-decline-close-grip-skull-crusher', name: '杠铃下斜窄握臂屈伸', en: 'Barbell Decline Close-Grip Skull Crusher', sources: ['hz:0035'], support: 'decline', lower: 'forehead' });

export default {
  ...exercise,
  pose(t) {
    const pose = exercise.pose(t);
    return {
      ...pose,
      // With the ankles hooked under the roller, both knees fold above the decline-bench line.
      legs: { near: { ...pose.legs.near, side: [0, -1] }, far: { ...pose.legs.far, side: [0, -1] } },
    };
  },
} satisfies SideExercise;
