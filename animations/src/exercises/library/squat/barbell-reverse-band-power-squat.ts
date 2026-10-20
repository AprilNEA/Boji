// Reverse-band power squat, side view. The high-back bar connects to an overhead band while the stance stays wide.
// The hips sit back past parallel under control, and both heels remain rooted as the athlete drives upward.
import type { SideExercise } from '@/exercise.ts';
import { add } from '@/math.ts';
import { bandLine, barbell } from '@/exercises/equipment/index.ts';
import { backBarAt, backRackArms, squatPose, squatTL, X0 } from './_squat-2.ts';

const tl = squatTL(0.25);
const ANCHOR: [number, number] = [X0 - 30, 38];
export default {
  id: 'barbell-reverse-band-power-squat', name: '杠铃反向弹力带力量举深蹲', tl,
  meta: { en: 'Barbell Reverse-Band Power Squat', family: 'squat', equipment: ['barbell', 'band', 'other'], sources: ['fe:Reverse_Band_Power_Squat'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.75 }, { m: 'hamstrings', side: 'both', scale: 0.5 }, { m: 'adductors', scale: 0.35 }, { m: 'lowerBack', scale: 0.35 }],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'rack-post', color: pal.prop, c: [ANCHOR[0] - 44, 238], s: [14, 400], r: 3 },
    { kind: 'box', nm: 'rack-top', color: pal.prop, c: [ANCHOR[0] + 6, 38], s: [116, 13], r: 3 },
  ] }),
  propsBox: [ANCHOR[0] - 58, X0 + 46],
  dynamic: [
    bandLine((J) => [[ANCHOR[0] - 25, ANCHOR[1]], add(backBarAt(J), [-42, 0])], 'back', 'Left Reverse Band'),
    bandLine((J) => [[ANCHOR[0] + 25, ANCHOR[1]], add(backBarAt(J), [42, 0])], 'back', 'Right Reverse Band'),
    barbell({ view: 'side', plate: 'medium', z: 'underNearArm', at: (J) => ({ p: backBarAt(J) }) }),
  ],
  pose: (t) => squatPose(tl.at(t).p, backRackArms(), { farDx: -10, back: 90, bottom: 94, lean: 50 }),
} satisfies SideExercise;
