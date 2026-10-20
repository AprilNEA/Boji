// Hold a horizontal ring Maltese with both arms long and the hands on separate rings.
// Open the straight legs into a wide straddle while the torso stays level.
// The ring contacts and the horizontal body line remain fixed for the hold.
import type { SideExercise } from '@/exercise.ts';
import { maltesePose } from './_core-stability-1.ts';

const effort = (t: number) => 0.84 + 0.08 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * t));

export default {
  id: 'ring-straddle-maltese',
  name: '吊环分腿水平十字支撑',
  tl: { total: 4 },
  meta: { en: 'Ring Straddle Maltese', family: 'core-stability', equipment: ['other'], sources: ['hz:3314'] },
  muscles: [{ m: 'abs', e: effort }, { m: 'delts', side: 'both', scale: 0.76, e: effort }, { m: 'pecs', scale: 0.6, e: effort }],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'ring-strap-high', color: pal.cable, c: [280, 125], s: [4, 190], r: 2 },
    { kind: 'box', nm: 'ring-strap-low', color: pal.cable, c: [282, 165], s: [4, 270], r: 2 },
    { kind: 'ring', nm: 'ring-high', color: pal.metal, c: [280, 220], s: [24, 30], w: 5 },
    { kind: 'ring', nm: 'ring-low', color: pal.metal, c: [280, 300], s: [24, 30], w: 5 },
  ] }),
  propsBox: [250, 450],
  poster: 0.25,
  pose: () => maltesePose(true),
} satisfies SideExercise;
