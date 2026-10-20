// Start with the sandbag on the floor and wrap both arms as far around it as possible.
// Lift it high against the chest, carry it to the raised platform, then extend and place it on top.
// The soft bag remains supported by both hands until it meets the platform edge.
import type { SideExercise } from '@/exercise.ts';
import { platformLoad } from './_carry-strongman.ts';

export default platformLoad({
  id: 'sandbag-load', name: '沙袋搬运上台', en: 'Sandbag Load',
  equipment: ['sandbag'], sources: ['fe:Sandbag_Load'],
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.65 }, { m: 'lowerBack', scale: 0.55 }, { m: 'biceps', side: 'both', scale: 0.4 }, { m: 'forearms', side: 'both', scale: 0.4 }],
}, 'sandbag') satisfies SideExercise;
