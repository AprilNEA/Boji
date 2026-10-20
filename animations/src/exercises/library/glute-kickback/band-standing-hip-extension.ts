// Start upright facing the low band anchor, with both hands holding the fixed upright and both feet under the hips.
// Alternate sides: the resisted leg stays straight and reaches 35 degrees behind vertical without moving the torso.
// The band attaches at ankle height and the support foot stays flat while the chest remains up.
import type { SideExercise } from '@/exercise.ts';
import { bandLine } from '@/exercises/equipment/index.ts';
import { alternate, alternateTL, activeValue, alternatingAnkle, hipExtensionLegs, STAND_HIP, STAND_ANKLE_Y, supportProps } from './_glute-kickback.ts';

const SUPPORT_X = 335;
const HAND_Y = 225;
const ANCHOR: [number, number] = [SUPPORT_X - 17, STAND_ANKLE_Y];

export default {
  id: 'band-standing-hip-extension',
  name: '弹力带站姿髋后伸',
  tl: alternateTL,
  props: supportProps(SUPPORT_X, HAND_Y),
  propsBox: [SUPPORT_X - 32, SUPPORT_X + 32],
  meta: {
    en: 'Band Standing Hip Extension',
    family: 'glute-kickback',
    equipment: ['band', 'other'],
    sources: ['fe:Hip_Extension_with_Bands'],
  },
  muscles: [
    { m: 'glutes', side: 'near', e: (t) => activeValue(t, 'near') },
    { m: 'glutes', side: 'far', e: (t) => activeValue(t, 'far') },
    { m: 'hamstrings', side: 'near', scale: 0.45, e: (t) => activeValue(t, 'near') },
    { m: 'hamstrings', side: 'far', scale: 0.45, e: (t) => activeValue(t, 'far') },
  ],
  dynamic: [bandLine((J, t) => [ANCHOR, alternatingAnkle(J, t)], 'back', 'Resistance Band')],
  pose(t) {
    const { side, p } = alternate(t);
    return {
      hip: STAND_HIP,
      spine: { lumbar: -90, thoracic: -90 },
      neck: -90,
      head: -90,
      farHip: 0,
      farShoulder: 0,
      legs: hipExtensionLegs(side, p, STAND_HIP),
      arms: {
        near: { target: [SUPPORT_X - 17, HAND_Y], side: [1, 0], hand: 90 },
        far: { target: [SUPPORT_X - 17, HAND_Y + 16], side: [1, 0], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
