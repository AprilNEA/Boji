// Start prone across the flat bench with the hips at its edge and both straight legs level with the hips.
// Hold the bench stable while one leg lifts as the other lowers in a small, controlled flutter.
import type { SideExercise } from '@/exercise.ts';
import { benchFlutter } from './_back-extension.ts';

export default benchFlutter({
  id: 'prone-bench-flutter-kick', name: '俯卧凳上交替打腿',
  meta: { en: 'Prone Bench Flutter Kick', family: 'back-extension', equipment: ['bench'], sources: ['fe:Flutter_Kicks'] },
}) satisfies SideExercise;
