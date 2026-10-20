// Start in a straight inclined plank with both hands on the near edge of a stable plyo box.
// Lower the chest to the box by bending the elbows, pause, then press back without letting the hips sag.
import type { SideExercise } from '@/exercise.ts';
import { plyoBox } from '@/exercises/equipment/index.ts';
import { raisedSupport, supportPush } from './_push-up-2.ts';

const box = plyoBox({ x: 401, h: 82, w: 118 });
const S = raisedSupport([360, box.top - 6]);
export default supportPush({
  id: 'box-incline-push-up', name: '箱上上斜俯卧撑', en: 'Box Incline Push-Up',
  equipment: ['bodyweight', 'box'], sources: ['hz:3785'],
  props: (pal) => ({ back: box.draw(pal) }), propsBox: box.box,
}, S) satisfies SideExercise;
