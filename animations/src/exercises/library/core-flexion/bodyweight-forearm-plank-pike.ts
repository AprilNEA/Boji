// Start in a forearm plank with elbows under shoulders, forearms and toes fixed on the mat.
// Raise the hips toward the ceiling into a pike without bending the knees, then lower to a straight plank.
import type { SideExercise } from '@/exercise.ts';
import { plankPike } from './_core-flexion-1.ts';
export default plankPike({ id: 'bodyweight-forearm-plank-pike', name: '自重前臂撑提臀', meta: { en: 'Bodyweight Forearm Plank Pike', family: 'core-flexion', equipment: ['bodyweight', 'mat'], sources: ['fe:Butt-Ups'] }, muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.3 }] }) satisfies SideExercise;
