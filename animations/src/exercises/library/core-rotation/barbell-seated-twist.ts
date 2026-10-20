// Sit upright at the end of a flat bench with grounded feet and the bar across the upper back.
// Keep the head and feet quiet while rotating the torso gently through the waist.
// Use a small controlled range and return through center before changing sides.
import type { SideExercise } from '@/exercise.ts';
import { add } from '@/math.ts';
import { A, G } from '@/exercises/common.ts';
import { barbell, flatBench } from '@/exercises/equipment/index.ts';
import { alternatingTL, alternate } from './_core-rotation-1.ts';

const BENCH = flatBench({ view: 'side', x: 220, top: 96, length: 230 });
const HIP: [number, number] = [220, BENCH.seatY - 5];
export default {
  id: 'barbell-seated-twist', name: '杠铃坐姿转体', tl: alternatingTL, poster: 0.14,
  meta: { en: 'Barbell Seated Twist', family: 'core-rotation', equipment: ['barbell', 'bench'], sources: ['fe:Seated_Barbell_Twist', 'hz:0094'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.85 }, { m: 'lowerBack', scale: 0.3 }, { m: 'forearms', side: 'both', scale: 0.25 }],
  props: (pal) => ({ back: BENCH.draw(pal) }), propsBox: BENCH.box,
  // The bar lies across the base of the neck, not in front of the chest.
  dynamic: [barbell({ view: 'side', plate: 'medium', z: 'overFarArm', at: (J) => ({ p: add(J.B(0.94), [-18, 4]) }) })],
  pose(t) {
    const { p, near } = alternate(t);
    const turn = (near ? 1 : -1) * 16 * p;
    return {
      // The rotation comes from the waist. Keep the head facing forward over the planted feet.
      hip: HIP, spine: { lumbar: -90 + turn * 0.35, thoracic: -91 + turn }, neck: -91, head: -91,
      legs: {
        near: { target: [315, G - A], foot: 0, side: [0, -1] },
        far: { target: [310, G - A], foot: 0, side: [0, -1] },
      },
      arms: {
        near: { target: (J) => add(J.B(0.92), [12, 7]), side: [-1, 0], hand: 0 },
        far: { target: (J) => add(J.B(0.92), [8, 5]), side: [-1, 0], hand: 0 },
      },
    };
  },
} satisfies SideExercise;
