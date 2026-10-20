// Lean forward from planted feet while holding two suspended handles and maintaining a straight body line.
// Let the elbows bend until the chest reaches the handles, then press back without letting the hips bend.
import type { SideExercise } from '@/exercise.ts';
import { raisedSupport, supportPush } from './_push-up-2.ts';

const S = raisedSupport([391, 352]);
export default supportPush({
  id: 'suspension-push-up', name: '悬吊俯卧撑', en: 'Suspension Push-Up', equipment: ['bodyweight', 'suspension'],
  sources: ['fe:Suspended_Push-Up', 'hz:0806'],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'suspension-anchor', color: pal.metalDark, c: [367, 75], s: [72, 12], r: 5 },
    { kind: 'poly', nm: 'far-strap', color: pal.cable, pts: [[350, 80], [388, 352]], w: 3, closed: false },
    { kind: 'poly', nm: 'near-strap', color: pal.cable, pts: [[380, 80], [391, 352]], w: 3, closed: false },
    { kind: 'box', nm: 'handle', color: pal.pad, c: [391, 352], s: [26, 8], r: 4 },
  ] }), propsBox: [330, 410],
}, S) satisfies SideExercise;
