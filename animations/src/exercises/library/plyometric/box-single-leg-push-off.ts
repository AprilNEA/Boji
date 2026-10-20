// One foot starts near the edge of the box and the other stays on the floor. Drive tall through the box-side hip and knee.
// The same foot returns to the box top. The free foot returns to its original floor contact.
import { boxExercise } from './_plyometric-2.ts';

export default boxExercise({
  id: 'box-single-leg-push-off', name: '单腿箱上蹬跳', en: 'Box Single-Leg Push-Off',
  sources: ['fe:Single_Leg_Push-off'], kind: 'push-off',
});
