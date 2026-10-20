// Start with the keg on the floor, then pull it close and secure it high against the chest.
// Step to the raised platform and extend through the hips and knees to place the keg on top.
// The keg stays in both hands until it reaches the platform edge.
import type { SideExercise } from '@/exercise.ts';
import { platformLoad } from './_carry-strongman.ts';

export default platformLoad({
  id: 'keg-load', name: '酒桶搬运上台', en: 'Keg Load',
  equipment: ['other'], sources: ['fe:Keg_Load'],
  muscles: [{ m: 'lowerBack' }, { m: 'quads', side: 'both', scale: 0.75 }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.6 }, { m: 'biceps', side: 'both', scale: 0.4 }, { m: 'traps', scale: 0.4 }],
}, 'keg') satisfies SideExercise;
