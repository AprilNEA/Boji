// Standing band single-leg extension, side view. Face a low fixed anchor with one foot planted and the trunk upright.
// Keep the working thigh raised and still while its knee extends from about 90° to nearly straight in front.
// The support foot, pelvis, and shoulders remain stable. The ankle band runs from the working ankle to the front anchor.
import type { SideExercise } from '@/exercise.ts';
import { lerp, type Vec2 } from '@/math.ts';
import type { Pose } from '@/rig.ts';
import { A, G, handOnHip } from '@/exercises/common.ts';
import { bandLine, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.35);
const HIP: Vec2 = [224, G - 196];
const ANCHOR: Vec2 = [440, G - 68];
/** Thigh stays level. The knee travels from a 94° bend to a 176° near-lockout. */
const SHIN_LOW = 94, SHIN_HIGH = 4;

const shinAt = (t: number): number => lerp(SHIN_LOW, SHIN_HIGH, tl.at(t).p);
const ankleAt = (t: number): Vec2 => {
  const a = shinAt(t) * Math.PI / 180;
  return [HIP[0] + 94 + 90 * Math.cos(a), HIP[1] + 90 * Math.sin(a)];
};

function pose(shin: number): Pose {
  return {
    hip: HIP,
    spine: { lumbar: -90, thoracic: -90 },
    neck: -90,
    head: -90,
    // The near leg is the working leg. Its thigh holds at hip height while only the knee moves.
    legs: {
      near: { a1: 0, a2: shin, foot: shin - 90 },
      // The far leg remains the planted support leg for the full repetition.
      far: { target: [HIP[0] - 3, G - A], foot: 0, side: [1, 0] },
    },
    arms: { near: handOnHip(0), far: handOnHip(-4) },
  };
}

export default {
  id: 'band-standing-single-leg-extension',
  name: '弹力带站姿单腿伸膝',
  tl,
  meta: {
    en: 'Band Standing Single-Leg Extension',
    family: 'leg-extension',
    equipment: ['band', 'other'],
    sources: ['hz:3007'],
  },
  muscles: [{ m: 'quads', side: 'near' }, { m: 'hipFlexor', side: 'near', scale: 0.45 }, { m: 'abs', scale: 0.3 }],
  props: (pal) => ({
    back: [
      { kind: 'box', nm: 'anchor-base', color: pal.metalDark, c: [440, G - 4], s: [58, 8], r: 3 },
      { kind: 'box', nm: 'anchor-upright', color: pal.metal, c: [440, G - 63], s: [14, 126], r: 6 },
      { kind: 'oval', nm: 'band-anchor', color: pal.metalDark, c: ANCHOR, s: [22, 22] },
      { kind: 'oval', nm: 'band-anchor-cap', color: pal.metal, c: ANCHOR, s: [8, 8] },
    ],
  }),
  propsBox: [HIP[0] - 58, 476],
  dynamic: [bandLine((_J, t) => [ANCHOR, ankleAt(t)], 'front', 'Resistance Band')],
  pose: (t) => pose(shinAt(t)),
} satisfies SideExercise;
