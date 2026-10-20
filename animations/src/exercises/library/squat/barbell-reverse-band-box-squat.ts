// Reverse-band box squat, side view. Bands hang from the top rail to a high-back bar while a box waits behind the hips.
// The athlete sits back to the box without bouncing, pauses, and rises through planted heels with the bar level.
import type { SideExercise } from '@/exercise.ts';
import { add } from '@/math.ts';
import { bandLine, barbell, plyoBox } from '@/exercises/equipment/index.ts';
import { backBarAt, backRackArms, squatPose, squatTL, X0 } from './_squat-2.ts';

const tl = squatTL(0.45);
const box = plyoBox({ x: X0 - 112, h: 96, w: 108 });
const ANCHOR: [number, number] = [X0 - 26, 42];
export default {
  id: 'barbell-reverse-band-box-squat', name: '杠铃反向弹力带箱式深蹲', tl,
  meta: { en: 'Barbell Reverse-Band Box Squat', family: 'squat', equipment: ['barbell', 'band', 'box', 'other'], sources: ['fe:Reverse_Band_Box_Squat'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.45 }, { m: 'adductors', scale: 0.35 }, { m: 'lowerBack', scale: 0.3 }],
  props: (pal) => ({ back: [
    ...box.draw(pal),
    { kind: 'box', nm: 'rack-post', color: pal.prop, c: [ANCHOR[0] - 44, 238], s: [14, 392], r: 3 },
    { kind: 'box', nm: 'rack-top', color: pal.prop, c: [ANCHOR[0] + 5, 42], s: [112, 13], r: 3 },
  ] }),
  propsBox: [box.box[0], X0 + 56],
  dynamic: [
    bandLine((J) => [[ANCHOR[0] - 25, ANCHOR[1]], add(backBarAt(J), [-42, 0])], 'back', 'Left Reverse Band'),
    bandLine((J) => [[ANCHOR[0] + 25, ANCHOR[1]], add(backBarAt(J), [42, 0])], 'back', 'Right Reverse Band'),
    barbell({ view: 'side', plate: 'medium', z: 'underNearArm', at: (J) => ({ p: backBarAt(J) }) }),
  ],
  pose: (t) => squatPose(tl.at(t).p, backRackArms(), { farDx: -10, back: 88, bottom: 96, lean: 48 }),
} satisfies SideExercise;
