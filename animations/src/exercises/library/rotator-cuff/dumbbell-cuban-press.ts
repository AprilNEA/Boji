// Begin with both upper arms level and the forearms hanging in a controlled scarecrow position.
// Externally rotate the forearms upright, then press the dumbbells overhead before reversing the sequence.
import type { FrontExercise } from '@/exercise.ts';
import { cubanPress } from './_rotator-cuff.ts';
export default cubanPress({ id: 'dumbbell-cuban-press', name: '哑铃古巴推举', en: 'Dumbbell Cuban Press', sources: ['fe:Cuban_Press', 'hz:0299', 'hz:2136'] }) satisfies FrontExercise;
