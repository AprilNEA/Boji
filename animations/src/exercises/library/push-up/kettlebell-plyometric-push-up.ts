// Start in a high plank with one hand on each stable kettlebell handle at shoulder width.
// Lower with tight elbows, then press explosively so the hands release and softly regrip the handles.
import type { SideExercise } from '@/exercise.ts';
import { floorKettlebells, plyoPush, raisedSupport } from './_push-up-2.ts';

const S = raisedSupport([399, 386]);
export default plyoPush({
  id: 'kettlebell-plyometric-push-up', name: '壶铃支撑爆发俯卧撑', en: 'Kettlebell Plyometric Push-Up',
  equipment: ['bodyweight', 'kettlebell'], sources: ['hz:0545'], dynamic: floorKettlebells(S),
}) satisfies SideExercise;
