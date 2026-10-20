// Lie with bent knees and flat feet secured under a low fixed support, with hands light behind the head.
// Raise the torso toward the knees without pulling the neck, then lower while the feet remain anchored.
import type { SideExercise } from '@/exercise.ts';
import { floorSitUp } from './_core-flexion-1.ts';
export default floorSitUp({ id: 'feet-anchored-sit-up', name: '固定双脚仰卧起坐', meta: { en: 'Feet-Anchored Sit-Up', family: 'core-flexion', equipment: ['bodyweight', 'mat', 'other'], sources: ['hz:1758'] }, muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.35 }] }, { anchor: true }) satisfies SideExercise;
