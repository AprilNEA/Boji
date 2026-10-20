// Start with the chest against the tire and both hands under its lower tread edge.
// Extend through the legs and hips to raise the tire, then change to a high hand position and push it over.
// The tire rotates forward onto the floor while both feet remain planted for the drive.
import type { SideExercise } from '@/exercise.ts';
import { tireFlip } from './_carry-strongman.ts';

export default tireFlip({
  id: 'tire-flip', name: '翻轮胎', en: 'Tire Flip',
  equipment: ['other'], sources: ['fe:Tire_Flip', 'hz:2459'],
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.8 }, { m: 'hamstrings', side: 'both', scale: 0.7 }, { m: 'lowerBack', scale: 0.55 }, { m: 'triceps', side: 'both', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.4 }],
}) satisfies SideExercise;
