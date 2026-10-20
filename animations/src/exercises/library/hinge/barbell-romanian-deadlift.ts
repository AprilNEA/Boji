// Start tall with the bar at arm's length against the thighs and the knees softly bent.
// Push the hips back while the bar stays close to the legs and the back remains extended.
// Reverse from the hamstring stretch by driving the hips forward to standing.
import type { SideExercise } from '@/exercise.ts';
import { barRdl } from './_hinge-1.ts';

export default barRdl({
  id: 'barbell-romanian-deadlift', name: '杠铃罗马尼亚硬拉', en: 'Barbell Romanian Deadlift',
  sources: ['fe:Romanian_Deadlift', 'hz:0085'],
}) satisfies SideExercise;
