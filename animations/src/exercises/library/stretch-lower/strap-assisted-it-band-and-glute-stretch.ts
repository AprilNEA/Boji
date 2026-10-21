// Start supine with a strap looped around one foot and both legs long.
// The working leg rises diagonally across the trunk while the pelvis and far leg stay on the mat.
import type { SideExercise } from '@/exercise.ts';
import type { Joints } from '@/rig/side.ts';
import { bandLine } from '@/exercises/equipment/index.ts';
import { libraryMeta, lowerStretch, supineRaised } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'strap-assisted-it-band-and-glute-stretch', name: '拉伸带辅助髂胫束及臀部拉伸',
  meta: libraryMeta('Strap-Assisted IT Band and Glute Stretch', ['other', 'band'], ['fe:IT_Band_and_Glute_Stretch']),
  muscles: [{ m: 'abductors', side: 'near' }, { m: 'glutes', side: 'near', scale: 0.4 }],
  dynamic: [bandLine<Joints>((J) => [J.wrist_n, J.ankle_n], 'underNearArm', 'Stretch strap')],
  pose: (p) => supineRaised(p, -105),
}) satisfies SideExercise;
