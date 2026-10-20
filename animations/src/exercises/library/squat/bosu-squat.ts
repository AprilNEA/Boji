// BOSU squat, side view. Both feet stand on the upward-facing flat platform while the dome rests on the floor.
// The hips sit back to parallel over stable heels and return without moving the balance trainer.
import type { SideExercise } from '@/exercise.ts';
import { hangingArms, squatPose, squatTL, X0 } from './_squat-2.ts';

const tl = squatTL(0.3);
const LIFT = 32;
export default {
  id: 'bosu-squat', name: '半球平衡球深蹲', tl,
  meta: { en: 'Bosu Squat', family: 'squat', equipment: ['bosu'], sources: ['hz:1705'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.55 }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'calves', side: 'both', scale: 0.25 }],
  props: (pal) => ({ back: [
    { kind: 'poly', nm: 'bosu-dome', color: pal.ball, pts: [[X0 - 67, 420], [X0 - 45, 438], [X0, 452], [X0 + 45, 438], [X0 + 67, 420]], smooth: true },
    { kind: 'box', nm: 'bosu-platform', color: pal.propDark, c: [X0, 419], s: [138, 12], r: 6 },
    { kind: 'box', nm: 'bosu-surface', color: pal.propLight, c: [X0, 415], s: [124, 5], r: 2.5 },
  ] }),
  propsBox: [X0 - 72, X0 + 72],
  pose: (t) => squatPose(tl.at(t).p, hangingArms(), { farDx: -6, floorLift: LIFT, back: 76, bottom: 104, lean: 37 }),
} satisfies SideExercise;
