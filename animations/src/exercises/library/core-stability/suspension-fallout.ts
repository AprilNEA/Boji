// Face away from the high anchor with both handles held at arm's length.
// Lean the straight body forward while the arms travel overhead in the suspension straps.
// Return from the long fallout without bending the elbows or arching the lower back.
import type { SideExercise } from '@/exercise.ts';
import { gripAt, workTL } from '@/exercises/equipment/index.ts';
import { suspensionFalloutPose } from './_core-stability-2.ts';

const tl = workTL(0.6);
const ANCHOR_N: [number, number] = [315, 62];
const ANCHOR_F: [number, number] = [306, 62];

export default {
  id: 'suspension-fallout',
  name: '悬吊前伸',
  tl,
  mat: true,
  meta: {
    en: 'Suspension Fallout', family: 'core-stability', equipment: ['bodyweight', 'suspension'],
    sources: ['fe:Suspended_Fallout', 'hz:0805'],
  },
  muscles: [
    { m: 'abs' }, { m: 'delts', side: 'both', scale: 0.62 }, { m: 'pecs', scale: 0.42 },
    { m: 'lowerBack', scale: 0.3 },
  ],
  props: (pal) => ({
    back: [
      { kind: 'box', nm: 'suspension-anchor', color: pal.metalDark, c: [310, 58], s: [54, 9], r: 4 },
      { kind: 'box', nm: 'suspension-ceiling-mount', color: pal.metal, c: [310, 44], s: [11, 24], r: 3 },
    ],
  }),
  dynamic: [
    { nm: 'Near suspension strap', kind: 'line', z: 'back', width: 3.5, color: (pal) => pal.cable, at: (J) => [ANCHOR_N, gripAt(J, 'n')] },
    { nm: 'Far suspension strap', kind: 'line', z: 'back', width: 3.5, color: (pal) => pal.cable, at: (J) => [ANCHOR_F, gripAt(J, 'f')] },
    {
      nm: 'Near suspension handle', kind: 'rigid', z: 'underNearArm',
      shapes: (pal) => [
        { kind: 'ring', nm: 'handle-loop', color: pal.metal, c: [0, 0], s: [19, 27], w: 3 },
        { kind: 'box', nm: 'handle-grip', color: pal.pad, c: [0, 7], s: [17, 7], r: 3.5 },
      ], at: (J) => ({ p: gripAt(J, 'n'), a: J.hand_n.a }),
    },
  ],
  propsBox: [270, 480],
  poster: 0.32,
  pose: (t) => suspensionFalloutPose(tl.at(t).p),
} satisfies SideExercise;
