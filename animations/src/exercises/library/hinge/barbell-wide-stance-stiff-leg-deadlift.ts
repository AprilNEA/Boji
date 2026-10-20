// Wide-stance stiff-leg barbell deadlift, side view. The knees stay softly bent while the hips travel backward.
// The arms remain long, the bar tracks over the feet, and the neutral torso hinges to a hamstring stretch.
import type { SideExercise } from '@/exercise.ts';
import { stiffLegDeadlift } from './_hinge-2.ts';

export default stiffLegDeadlift({
  id: 'barbell-wide-stance-stiff-leg-deadlift', name: '杠铃宽站距直腿硬拉', en: 'Barbell Wide-Stance Stiff-Leg Deadlift', equipment: ['barbell'],
  sources: ['fe:Wide_Stance_Stiff_Legs'],
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.8 }, { m: 'adductors', side: 'both', scale: 0.5 }, { m: 'lowerBack', scale: 0.45 }],
}, { implement: 'barbell', wide: true }) satisfies SideExercise;
