// Start face down on a mat with arms extended overhead, chest lifted and both straight legs clear of the floor.
// Maintain the trunk position as the legs trade a small, even swimming kick without knee bend.
import type { SideExercise } from '@/exercise.ts';
import { proneFlutter } from './_back-extension.ts';

export default proneFlutter({
  id: 'prone-flutter-kick', name: '俯卧交替打腿',
  meta: { en: 'Prone Flutter Kick', family: 'back-extension', equipment: ['bodyweight', 'mat'], sources: ['hz:3433'] },
}) satisfies SideExercise;
