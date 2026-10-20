// Face away from the loaded sled and hold both straps close to the body.
// Lean back against the tension and drive short controlled backward steps.
// The straps stay taut from the sled to the hands throughout the drag.
import type { SideExercise } from '@/exercise.ts';
import { backwardSledDrag } from './_carry-strongman.ts';

export default backwardSledDrag({
  id: 'sled-backward-drag', name: '雪橇后退拖拉', en: 'Sled Backward Drag',
  equipment: ['sled', 'rope'], sources: ['fe:Backward_Drag'],
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.6 }, { m: 'calves', side: 'both', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.35 }],
}) satisfies SideExercise;
