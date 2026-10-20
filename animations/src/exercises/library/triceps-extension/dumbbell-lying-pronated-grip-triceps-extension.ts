// Lie on a flat bench with pronated dumbbell grips, elbows tucked, and upper arms vertical.
// Lower both dumbbells near the ears by bending the elbows, then extend them together.
import type { SideExercise } from '@/exercise.ts';
import { lyingTricepsExtension } from './_triceps-extension-2.ts';

export default lyingTricepsExtension({
  id: 'dumbbell-lying-pronated-grip-triceps-extension', name: '哑铃正握仰卧臂屈伸', grip: 'end',
  meta: { en: 'Dumbbell Lying Pronated-Grip Triceps Extension', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['fe:Dumbbell_Tricep_Extension_-Pronated_Grip'] },
}) satisfies SideExercise;
