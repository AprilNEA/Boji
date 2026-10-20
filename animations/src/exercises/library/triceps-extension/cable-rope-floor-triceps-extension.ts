// Lie on the floor with the head toward the low pulley and both upper arms vertical.
// Lower the rope toward the forehead by elbow flexion, then return to a straight-arm position.
import type { SideExercise } from '@/exercise.ts';
import { lyingTricepsExtension } from './_triceps-extension-2.ts';

export default lyingTricepsExtension({
  id: 'cable-rope-floor-triceps-extension', name: '绳索绳把仰卧地板臂屈伸', cable: true, floor: true,
  meta: { en: 'Cable Rope Floor Triceps Extension', family: 'triceps-extension', equipment: ['cable', 'mat'], sources: ['hz:1726'] },
}) satisfies SideExercise;
