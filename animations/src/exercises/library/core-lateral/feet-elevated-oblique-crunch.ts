// Lie supine with one hand beside the head and both feet supported above the floor.
// Curl the shoulder toward the opposite knee, then alternate sides on the next repetition.
// Keep the lower back pressed down and the lower-leg support fixed.
import type { SideExercise } from '@/exercise.ts';
import { supineObliqueCrunch } from './_core-lateral.ts';

const exercise = supineObliqueCrunch({
  id: 'feet-elevated-oblique-crunch', name: '抬脚斜向卷腹', en: 'Feet-Elevated Oblique Crunch', elevatedFeet: true,
  sources: ['fe:Oblique_Crunches'],
});
export default exercise satisfies SideExercise;
