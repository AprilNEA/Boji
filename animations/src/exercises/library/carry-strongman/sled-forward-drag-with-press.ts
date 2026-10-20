// Face away from the sled with a dual handle in each hand and the straps under tension.
// Step forward while leaning slightly ahead, then extend both elbows to press the handles forward.
// Return the hands as the next step prepares the next press.
import type { SideExercise } from '@/exercise.ts';
import { forwardDragPress } from './_carry-strongman.ts';

export default forwardDragPress({
  id: 'sled-forward-drag-with-press', name: '雪橇前向拖行加推胸', en: 'Sled Forward Drag with Press',
  equipment: ['sled', 'rope'], sources: ['fe:Forward_Drag_with_Press'],
  muscles: [{ m: 'pecs', scale: 1 }, { m: 'triceps', side: 'both', scale: 0.7 }, { m: 'quads', side: 'both', scale: 0.55 }, { m: 'glutes', scale: 0.4 }],
}) satisfies SideExercise;
