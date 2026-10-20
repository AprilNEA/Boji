// Begin in a braced plank with both palms balanced on a medicine ball beneath the chest.
// Lower the chest toward the ball with a straight trunk, then press back to fully extended arms.
import type { SideExercise } from '@/exercise.ts';
import { medicineBallSupport, raisedSupport, supportPush } from './_push-up-2.ts';

const center: [number, number] = [380, 418];
const S = raisedSupport([380, 390]);
export default supportPush({
  id: 'medicine-ball-push-up', name: '药球俯卧撑', en: 'Medicine Ball Push-Up',
  equipment: ['bodyweight', 'medicine-ball'], sources: ['hz:0663'], dynamic: medicineBallSupport(center), propsBox: [350, 410],
}, S) satisfies SideExercise;
