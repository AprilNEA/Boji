// Lie supine with both knees bent, feet flat and arms beside the body.
// Raise the shoulder blades and reach toward one heel, then alternate to the other heel.
// Keep the pelvis and feet fixed against the floor.
import type { SideExercise } from '@/exercise.ts';
import { supineObliqueCrunch } from './_core-lateral.ts';
const exercise = supineObliqueCrunch({
  id: 'alternating-heel-touch', name: '仰卧交替摸脚跟', en: 'Alternating Heel Touch', heelTouch: true,
  sources: ['fe:Alternate_Heel_Touchers', 'hz:0006'],
});
export default exercise satisfies SideExercise;
