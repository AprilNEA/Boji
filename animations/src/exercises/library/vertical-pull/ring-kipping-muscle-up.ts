// Use a false grip, sweep the legs back then forward, and pull the rings toward the armpits.
// Roll over the rings into support, extend the elbows, then return through the controlled transition.
import type { SideExercise } from '@/exercise.ts';
import { ringMuscleUp } from './_vertical-pull-2.ts';

export default ringMuscleUp({
  id: 'ring-kipping-muscle-up', name: '吊环借力双力臂', en: 'Ring Kipping Muscle-Up', equipment: ['suspension'],
  sources: ['fe:Kipping_Muscle_Up'],
}, { kipping: true }) satisfies SideExercise;
