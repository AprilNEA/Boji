// Start facing the cable stack with an ankle cuff on the low pulley, soft knees, a small hip hinge, and both hands braced.
// Alternate sides: the cuffed leg moves 42 degrees backward from vertical and pauses at controlled hip extension.
// The column, cable, hands, support foot, and neutral trunk stay fixed throughout the arc.
import type { SideExercise } from '@/exercise.ts';
import { cableColumn, cableLine } from '@/exercises/equipment/index.ts';
import { alternate, alternateTL, activeValue, alternatingAnkle, cableCuff, hipExtensionLegs, STAND_ANKLE_Y } from './_glute-kickback.ts';

const COLUMN = cableColumn({ x: 335, pulleyY: STAND_ANKLE_Y - 27, toward: -1 });
const HIP: [number, number] = [250, STAND_ANKLE_Y - 182];
const HAND_Y = 225;

export default {
  id: 'cable-standing-glute-kickback',
  name: '绳索站姿臀部后踢',
  tl: alternateTL,
  props: (pal) => ({ back: COLUMN.draw(pal) }),
  propsBox: COLUMN.box,
  meta: {
    en: 'Cable Standing Glute Kickback',
    family: 'glute-kickback',
    equipment: ['cable'],
    sources: ['fe:One-Legged_Cable_Kickback'],
  },
  muscles: [
    { m: 'glutes', side: 'near', e: (t) => activeValue(t, 'near') },
    { m: 'glutes', side: 'far', e: (t) => activeValue(t, 'far') },
    { m: 'hamstrings', side: 'near', scale: 0.4, e: (t) => activeValue(t, 'near') },
    { m: 'hamstrings', side: 'far', scale: 0.4, e: (t) => activeValue(t, 'far') },
  ],
  dynamic: [
    cableLine(COLUMN.pulley, alternatingAnkle, 'Low Cable'),
    cableCuff(alternatingAnkle),
  ],
  pose(t) {
    const { side, p } = alternate(t);
    return {
      hip: HIP,
      spine: { lumbar: -78, thoracic: -80 },
      neck: -80,
      head: -80,
      farHip: 0,
      farShoulder: 0,
      legs: hipExtensionLegs(side, p, HIP, 132, 182),
      arms: {
        near: { target: [COLUMN.pulley[0], HAND_Y], side: [1, 0], hand: 90 },
        far: { target: [COLUMN.pulley[0], HAND_Y + 16], side: [1, 0], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
