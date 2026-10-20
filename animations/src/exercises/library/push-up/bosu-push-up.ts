// Start in a rigid high plank with both hands gripping the outside edges of a flat-based BOSU dome.
// Lower the chest toward the unstable dome with the elbows bending, then press back without moving the feet.
import type { SideExercise } from '@/exercise.ts';
import { raisedSupport, supportPush } from './_push-up-2.ts';

const S = raisedSupport([380, 405]);
export default supportPush({
  id: 'bosu-push-up', name: '波速球俯卧撑', en: 'Bosu Push-Up', equipment: ['bodyweight', 'bosu'], sources: ['hz:1307', 'hz:0653'],
  props: (pal) => ({ back: [
    { kind: 'oval', nm: 'bosu-dome', color: pal.ball, c: [380, 423], s: [92, 48] },
    { kind: 'box', nm: 'bosu-base', color: pal.propDark, c: [380, 444], s: [94, 9], r: 4 },
    { kind: 'oval', nm: 'bosu-shine', color: pal.ballShine, c: [362, 414], s: [19, 8], rot: -25 },
  ] }), propsBox: [330, 430],
}, S) satisfies SideExercise;
