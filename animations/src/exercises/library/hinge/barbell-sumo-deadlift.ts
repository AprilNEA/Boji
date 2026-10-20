// Barbell sumo deadlift, side view. The stance is wide and the hands hold the bar inside the legs.
// Start with the plates on the floor, extend knees and hips together, then return the bar under control.
import type { SideExercise } from '@/exercise.ts';
import { floorDeadlift } from './_hinge-2.ts';

export default floorDeadlift({
  id: 'barbell-sumo-deadlift', name: '杠铃相扑硬拉', en: 'Barbell Sumo Deadlift', equipment: ['barbell'],
  sources: ['fe:Sumo_Deadlift', 'hz:0117'],
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.85 }, { m: 'quads', side: 'both', scale: 0.75 }, { m: 'adductors', side: 'both', scale: 0.5 }, { m: 'lowerBack', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.3 }],
}, { implement: 'barbell', sumo: true }) satisfies SideExercise;
