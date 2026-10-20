// Stand tall with relaxed arms hanging freely at the sides.
// Lift the shoulders toward the ears and lower them again without moving the elbows or torso.
import type { FrontExercise } from '@/exercise.ts';
import { frontShrug } from './_shrug-upright-row.ts';

export default frontShrug({
  id: 'bodyweight-shoulder-shrug', name: '徒手耸肩', en: 'Bodyweight Shoulder Shrug',
  equipment: ['bodyweight'], sources: ['fe:Shoulder_Raise'], implement: 'bodyweight',
}) satisfies FrontExercise;
