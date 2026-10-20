// Start with the bar on the floor and chains pooled beside the loaded sleeve.
// Extend the knees and hips until the bar reaches the thighs as more chain clears the floor.
// The feet stay planted, the arms remain straight, and the chain settles back during descent.
import type { SideExercise } from '@/exercise.ts';
import { barChains, barDeadlift } from './_hinge-1.ts';

export default barDeadlift({
  id: 'barbell-deadlift-with-chains', name: '铁链阻力杠铃硬拉', en: 'Barbell Deadlift with Chains',
  sources: ['fe:Deadlift_with_Chains'], extra: barChains(),
}) satisfies SideExercise;
