// Start hanging underhand with the calves level and the knees bent at right angles.
// Pull the nose to bar height while folding both knees to the chest, then return together.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'chin-up-with-knee-crunch', name: '反握引体卷腹', en: 'Chin-Up with Knee Crunch', equipment: ['pull-up-bar'],
  sources: ['fe:Gorilla_Chin_Crunch'],
}, { kneeCrunch: true }) satisfies SideExercise;
