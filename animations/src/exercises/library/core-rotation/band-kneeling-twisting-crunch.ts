// Kneel facing away from a waist-high anchor with both hands holding the band close to the chest.
// Flex and rotate the torso to draw the hands toward the opposite hip.
// The knees stay down and the band remains attached to the fixed anchor.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp } from '@/math.ts';
import { FLOOR } from '@/exercises/common.ts';
import { bandLine } from '@/exercises/equipment/index.ts';
import { alternatingTL, alternate } from './_core-rotation-1.ts';

const ANCHOR: [number, number] = [145, FLOOR - 122];
export default {
  id: 'band-kneeling-twisting-crunch', name: '弹力带跪姿转体卷腹', tl: alternatingTL, mat: true, poster: 0.14,
  meta: { en: 'Band Kneeling Twisting Crunch', family: 'core-rotation', equipment: ['band'], sources: ['hz:0985'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.8 }],
  props: (pal) => ({ back: [{ kind: 'box', nm: 'band-anchor', color: pal.metalDark, c: ANCHOR, s: [16, 16], r: 4 }] }),
  dynamic: [
    bandLine((J) => [ANCHOR, J.wrist_n], 'underNearArm', 'Near band end'),
    bandLine((J) => [ANCHOR, J.wrist_f], 'overFarArm', 'Far band end'),
  ],
  pose(t) {
    const { p, near } = alternate(t);
    const side = near ? 1 : -1;
    return {
      hip: [260, FLOOR - 94],
      spine: { lumbar: lerp(-90, -58, p) + side * 5 * p, thoracic: lerp(-92, -54, p) + side * 12 * p }, neck: lerp(-93, -58, p) + side * 12 * p, head: lerp(-93, -58, p) + side * 12 * p,
      legs: {
        near: { a1: 90, a2: 180, foot: 180 },
        far: { a1: 90, a2: 180, foot: 180 },
      },
      arms: {
        near: { target: (J) => add(J.B(0.32), [26 + side * 10 * p, 22 + 22 * p]), side: [-1, 0], hand: 35 },
        far: { target: (J) => add(J.B(0.32), [20 + side * 10 * p, 20 + 22 * p]), side: [-1, 0], hand: 35 },
      },
    };
  },
} satisfies SideExercise;
