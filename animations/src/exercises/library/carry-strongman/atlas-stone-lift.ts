// Start with the stone between the feet and the fingers under its lower edge.
// Pull it from the floor, lap it on the thighs, then hug it high against the chest while standing.
// The feet stay planted and the stone remains wrapped by both arms through the lift.
import type { SideExercise } from '@/exercise.ts';
import { atlasStoneLift } from './_carry-strongman.ts';

export default atlasStoneLift({
  id: 'atlas-stone-lift', name: '阿特拉斯石上举', en: 'Atlas Stone Lift',
  equipment: ['other'], sources: ['fe:Atlas_Stones'],
  muscles: [{ m: 'lowerBack' }, { m: 'quads', side: 'both', scale: 0.7 }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.6 }, { m: 'biceps', side: 'both', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.4 }],
}) satisfies SideExercise;
