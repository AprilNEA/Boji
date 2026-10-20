// Dumbbell Romanian deadlift, side view. The feet stay planted and the knees stay soft as both hips move back.
// The weights remain near the legs while the long neutral spine hinges to the hamstring stretch and returns tall.
import type { SideExercise } from '@/exercise.ts';
import { stiffLegDeadlift } from './_hinge-2.ts';

export default stiffLegDeadlift({
  id: 'dumbbell-romanian-deadlift', name: '哑铃罗马尼亚硬拉', en: 'Dumbbell Romanian Deadlift', equipment: ['dumbbell'],
  sources: ['hz:1459'],
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both' }, { m: 'lowerBack', scale: 0.45 }],
}, { implement: 'dumbbell' }) satisfies SideExercise;
