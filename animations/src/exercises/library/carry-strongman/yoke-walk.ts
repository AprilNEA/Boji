// Start upright with the yoke crossbar racked across the upper back and shoulders.
// Hold the side posts to steady the frame and walk with short, quick steps.
// The yoke stays level while both feet alternate between a flat stance and a small swing.
import type { SideExercise } from '@/exercise.ts';
import { yokeWalk } from './_carry-strongman.ts';

export default yokeWalk({
  id: 'yoke-walk', name: '负重轭架行走', en: 'Yoke Walk',
  equipment: ['other'], sources: ['fe:Yoke_Walk'],
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.6 }, { m: 'calves', side: 'both', scale: 0.5 }, { m: 'lowerBack', scale: 0.5 }],
}) satisfies SideExercise;
