// Weighted bench dip, side view. The hands stay on the rear bench and the heels rest on the front bench.
// A dumbbell remains across the thighs while the elbows bend just past 90° and then press to lockout.
import type { SideExercise } from '@/exercise.ts';
import { benchDip } from './_dip.ts';

export default benchDip({
  id: 'weighted-bench-dip', name: '负重凳上臂屈伸', en: 'Weighted Bench Dip', equipment: ['bench', 'dumbbell'],
  sources: ['fe:Weighted_Bench_Dip', 'hz:0830', 'hz:1755'],
}, { weighted: true }) satisfies SideExercise;
