// Lie on a decline bench with the ankles secured and upper arms held steady near the head.
// Lower neutral-grip dumbbells beside the ears, then extend both elbows to the start.
import type { SideExercise } from '@/exercise.ts';
import { lyingTricepsExtension } from './_triceps-extension-2.ts';

const exercise = lyingTricepsExtension({
  id: 'dumbbell-decline-triceps-extension', name: '哑铃下斜臂屈伸', decline: true,
  meta: { en: 'Dumbbell Decline Triceps Extension', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['fe:Decline_Dumbbell_Triceps_Extension', 'hz:0306'] },
});

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
