// Cable squat curl, side view. A low front pulley stays connected as straight arms curl while the hips lower.
// The elbows stay close to the torso, the heels stay down, and the arms extend again as the athlete stands.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { cableColumn, cableHandle, cableLine, gripAt, towardCable } from '@/exercises/equipment/index.ts';
import { squatPose, squatTL, X0 } from './_squat-2.ts';

const tl = squatTL(0.3);
const station = cableColumn({ x: 410, pulleyY: 402, toward: -1 });
const arm = (p: number, far: boolean) => ({ a1: far ? 94 : 91, a2: lerp(far ? 88 : 86, far ? -54 : -57, p), hand: lerp(far ? 88 : 86, far ? -54 : -57, p) });
export default {
  id: 'cable-squat-curl', name: '绳索深蹲弯举', tl,
  meta: { en: 'Cable Squat Curl', family: 'squat', equipment: ['cable'], sources: ['hz:1644'] },
  muscles: [{ m: 'biceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.5 }, { m: 'quads', side: 'both', scale: 0.5 }, { m: 'glutes', scale: 0.3 }],
  props: (pal) => ({ back: station.draw(pal) }), propsBox: [X0 - 55, station.box[1]],
  dynamic: [
    cableLine(station.pulley, (J) => gripAt(J), 'Curl Cable'),
    cableHandle('end', (J) => ({ p: gripAt(J), a: towardCable(gripAt(J), station.pulley) }), { z: 'underNearArm' }),
  ],
  pose: (t) => { const p = tl.at(t).p; return squatPose(p, { near: arm(p, false), far: arm(p, true) }, { farDx: -6, back: 66, bottom: 104, lean: 30 }); },
} satisfies SideExercise;
