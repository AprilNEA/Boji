// Start with a shoulder-width clean grip, hips above the knees and shoulders slightly ahead of the bar.
// Drive through the floor while the back angle stays braced until the bar passes the knees.
// Finish by extending the hips and knees only; this animation does not add a shrug or a catch.
import type { SideExercise } from '@/exercise.ts';
import { barDeadlift } from './_hinge-1.ts';

export default barDeadlift({
  id: 'barbell-clean-deadlift', name: '杠铃翻举式硬拉', en: 'Barbell Clean Deadlift',
  sources: ['fe:Clean_Deadlift'],
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes' }, { m: 'quads', side: 'both', scale: 0.65 }, { m: 'lowerBack', scale: 0.65 }, { m: 'traps', scale: 0.4 }, { m: 'forearms', side: 'both', scale: 0.35 }],
}) satisfies SideExercise;
