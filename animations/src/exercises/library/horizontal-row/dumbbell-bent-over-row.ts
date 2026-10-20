// Stand with soft knees and a flat back hinged almost parallel to the floor.
// Both dumbbells hang below the shoulders, then the elbows row close to the sides without torso movement.
import type { SideExercise } from '@/exercise.ts';
import { hingeRow } from './_horizontal-row-2.ts';

export default hingeRow({
  id: 'dumbbell-bent-over-row', name: '哑铃俯身划船', en: 'Dumbbell Bent-Over Row',
  equipment: ['dumbbell'], sources: ['fe:Bent_Over_Two-Dumbbell_Row', 'hz:0293'], weight: 'dumbbell',
}) satisfies SideExercise;
