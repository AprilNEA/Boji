// Start face down with straight arms reaching forward and both legs long on the mat.
// Lift the chest, arms and legs together into a shallow flying hold, then lower with control.
import type { SideExercise } from '@/exercise.ts';
import { superman } from './_back-extension.ts';

export default superman({
  id: 'superman', name: '俯卧超人挺身',
  meta: { en: 'Superman', family: 'back-extension', equipment: ['bodyweight', 'mat'], sources: ['fe:Superman'] },
}) satisfies SideExercise;
