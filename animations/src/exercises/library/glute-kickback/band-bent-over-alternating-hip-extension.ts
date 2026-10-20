// Start facing away from a low band anchor with soft knees, a 47-degree hip hinge, and a neutral spine.
// Alternate sides: each straight leg aligns with the fixed torso at the peak, giving the hip about 170 degrees.
// The anchor remains behind the body at ankle height, so the band stays visibly resisted throughout the kickback.
import type { SideExercise } from '@/exercise.ts';
import { bandLine } from '@/exercises/equipment/index.ts';
import { G } from '@/exercises/common.ts';
import { alternate, alternateTL, activeValue, alternatingAnkle, hipExtensionLegs, lowAnchorProps } from './_glute-kickback.ts';

const HIP: [number, number] = [250, G - 195];
const ANCHOR_X = 50;
const ANCHOR: [number, number] = [ANCHOR_X + 11, G - 13];

export default {
  id: 'band-bent-over-alternating-hip-extension',
  name: '弹力带俯身交替髋后伸',
  tl: alternateTL,
  props: lowAnchorProps(ANCHOR_X),
  propsBox: [ANCHOR_X - 30, 360],
  meta: {
    en: 'Band Bent-Over Alternating Hip Extension',
    family: 'glute-kickback',
    equipment: ['band', 'other'],
    sources: ['hz:0980'],
  },
  muscles: [
    { m: 'glutes', side: 'near', e: (t) => activeValue(t, 'near') },
    { m: 'glutes', side: 'far', e: (t) => activeValue(t, 'far') },
    { m: 'hamstrings', side: 'near', scale: 0.45, e: (t) => activeValue(t, 'near') },
    { m: 'hamstrings', side: 'far', scale: 0.45, e: (t) => activeValue(t, 'far') },
    { m: 'lowerBack', scale: 0.35 },
  ],
  dynamic: [bandLine((J, t) => [ANCHOR, alternatingAnkle(J, t)], 'back', 'Resistance Band')],
  pose(t) {
    const { side, p } = alternate(t);
    return {
      hip: HIP,
      spine: { lumbar: -42, thoracic: -44 },
      neck: -39,
      head: -42,
      farHip: 0,
      farShoulder: 0,
      legs: hipExtensionLegs(side, p, HIP, 138, 182),
      arms: {
        near: { a1: 85, a2: 85, hand: 85 },
        far: { a1: 85, a2: 85, hand: 85 },
      },
    };
  },
} satisfies SideExercise;
