// Start with a floor bar, hip-width feet, and hands set visibly wide in a snatch grip.
// Keep the trunk braced during the first pull, then extend the hips and knees to lockout.
// The front view exposes the grip width while the bar stays level and both feet stay planted.
import type { FrontExercise } from '@/exercise.ts';
import { frontDeadlift } from './_hinge-1.ts';

export default frontDeadlift({
  id: 'barbell-snatch-grip-deadlift', name: '杠铃抓举握距硬拉', en: 'Barbell Snatch-Grip Deadlift',
  sources: ['fe:Snatch_Deadlift'], snatchGrip: true,
}) satisfies FrontExercise;
