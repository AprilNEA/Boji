// Start supine with a strap around one foot and both legs extended.
// The working knee stays straight as the strap guides that leg out from the trunk; the pelvis stays down.
import type { SideExercise } from '@/exercise.ts';
import type { Joints } from '@/rig.ts';
import { bandLine } from '@/exercises/equipment/index.ts';
import { libraryMeta, lowerStretch, supineRaised } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'strap-assisted-supine-groin-stretch', name: '拉伸带辅助仰卧腹股沟拉伸',
  meta: libraryMeta('Strap-Assisted Supine Groin Stretch', ['other', 'band'], ['fe:Intermediate_Groin_Stretch']),
  muscles: [{ m: 'adductors', side: 'near' }, { m: 'hamstrings', side: 'near', scale: 0.4 }],
  dynamic: [bandLine<Joints>((J) => [J.wrist_n, J.ankle_n], 'underNearArm', 'Stretch strap')],
  pose: (p) => supineRaised(p, -78),
}) satisfies SideExercise;
