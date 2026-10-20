// Start facing forward with a harness tethered to the sled behind the body.
// Lean forward in the direction of travel and use short alternating steps.
// The arms stay free while the taut tether transfers force through the torso.
import type { SideExercise } from '@/exercise.ts';
import { harnessSledDrag } from './_carry-strongman.ts';

export default harnessSledDrag({
  id: 'sled-harness-drag', name: '雪橇背带拖行', en: 'Sled Harness Drag',
  equipment: ['sled', 'rope'], sources: ['fe:Sled_Drag_-_Harness'],
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.65 }, { m: 'hamstrings', side: 'both', scale: 0.5 }, { m: 'calves', side: 'both', scale: 0.4 }],
}) satisfies SideExercise;
