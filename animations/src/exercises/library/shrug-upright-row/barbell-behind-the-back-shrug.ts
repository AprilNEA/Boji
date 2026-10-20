// Stand tall with a wide overhand barbell grip behind the hips and straight elbows.
// Elevate the shoulders toward the ears, then lower without curling the arms or leaning the torso.
import type { FrontExercise } from '@/exercise.ts';
import { frontShrug } from './_shrug-upright-row.ts';

export default frontShrug({
  id: 'barbell-behind-the-back-shrug', name: '杠铃背后耸肩', en: 'Barbell Behind-the-Back Shrug',
  equipment: ['barbell'], sources: ['fe:Barbell_Shrug_Behind_The_Back'], implement: 'barbell', behind: true,
}) satisfies FrontExercise;
