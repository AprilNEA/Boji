// Stand with feet planted and hold the barbell at chest height with both hands.
// Rotate the rib cage gently from side to side while the lower body remains stable.
// The bar stays close to the chest throughout the controlled range.
import type { SideExercise } from '@/exercise.ts';
import { add } from '@/math.ts';
import { BODY } from '@/rig.ts';
import { A, G, standLegs } from '@/exercises/common.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { alternatingTL, alternate } from './_core-rotation-1.ts';

const HIP: [number, number] = [250, G - A - BODY.thigh - BODY.shin];
export default {
  id: 'barbell-standing-twist', name: '杠铃站姿转体', tl: alternatingTL, poster: 0.14,
  meta: { en: 'Barbell Standing Twist', family: 'core-rotation', equipment: ['barbell'], sources: ['hz:0112'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.85 }, { m: 'lowerBack', scale: 0.35 }, { m: 'forearms', side: 'both', scale: 0.25 }],
  dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: add(J.B(0.68), [27, 10]) }) })],
  pose(t) {
    const { p, near } = alternate(t);
    const turn = (near ? 1 : -1) * 18 * p;
    return {
      hip: HIP, spine: { lumbar: -90 + turn * 0.3, thoracic: -90 + turn }, neck: -90 + turn, head: -90 + turn,
      legs: standLegs(250, 0),
      arms: {
        near: { target: (J) => add(J.B(0.68), [18, 10]), side: [-1, 0], hand: 0 },
        far: { target: (J) => add(J.B(0.68), [14, 7]), side: [-1, 0], hand: 0 },
      },
    };
  },
} satisfies SideExercise;
