// Begin in a high plank with hands wider than the shoulders and both toes on the mat.
// Lower the chest while one knee tracks toward its same-side elbow, then alternate on the next repetition.
import type { SideExercise } from '@/exercise.ts';
import { spidermanPush } from './_push-up-2.ts';

export default spidermanPush({
  id: 'spiderman-push-up', name: '蜘蛛侠俯卧撑', en: 'Spiderman Push-Up',
  equipment: ['bodyweight'], sources: ['hz:0778'],
}) satisfies SideExercise;
