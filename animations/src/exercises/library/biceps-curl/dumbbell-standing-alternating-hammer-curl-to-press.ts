// Alternating hammer curl to press, side view. The torso stays tall and both elbows remain close to the torso.
// The loop shows a right curl, left curl, right overhead press and left overhead press in that order.
// Each dumbbell uses a neutral grip and returns under control before the next action begins.
import type { SideExercise } from '@/exercise.ts';
import { makeAlternatingCurlToPress } from './_biceps-curl-4.ts';

export default makeAlternatingCurlToPress({
  id: 'dumbbell-standing-alternating-hammer-curl-to-press',
  name: '站姿交替哑铃锤式弯举推举',
  en: 'Dumbbell Standing Alternating Hammer Curl to Press',
  sources: ['hz:3560'],
}) satisfies SideExercise;
