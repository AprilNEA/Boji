// Chained barbell sumo deadlift, side view. The wide stance and inside hand position stay fixed as the bar rises.
// Chains hang from the loaded sleeve and progressively leave the floor through a controlled hip-and-knee extension.
import type { SideExercise } from '@/exercise.ts';
import { floorDeadlift } from './_hinge-2.ts';

export default floorDeadlift({
  id: 'barbell-sumo-deadlift-with-chains', name: '杠铃铁链相扑硬拉', en: 'Barbell Sumo Deadlift with Chains', equipment: ['barbell'],
  sources: ['fe:Sumo_Deadlift_with_Chains'],
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.85 }, { m: 'quads', side: 'both', scale: 0.75 }, { m: 'adductors', side: 'both', scale: 0.5 }, { m: 'lowerBack', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.3 }],
}, { implement: 'barbell', sumo: true, chains: true }) satisfies SideExercise;
