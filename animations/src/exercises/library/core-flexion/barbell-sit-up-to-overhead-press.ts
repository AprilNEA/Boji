// Begin secured on an abdominal bench with the barbell held at the chest.
// Simultaneously sit up and press the barbell overhead, then return the bar to the chest with the torso.
import type { SideExercise } from '@/exercise.ts';
import { barbellBenchSitUp } from './_core-flexion-1.ts';
export default barbellBenchSitUp({ id: 'barbell-sit-up-to-overhead-press', name: '杠铃仰卧起坐接推举', meta: { en: 'Barbell Sit-Up to Overhead Press', family: 'core-flexion', equipment: ['barbell', 'bench'], sources: ['fe:Press_Sit-Up'] }, muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.5 }, { m: 'triceps', side: 'both', scale: 0.35 }] }) satisfies SideExercise;
